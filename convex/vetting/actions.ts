// @ts-nocheck
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import OpenAI from "openai";

/**
 * Grade written English response using AI
 */
export const gradeWrittenResponse = action({
  args: {
    vettingResultId: v.id("vettingResults"),
    writtenResponse: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const score = await gradeWithAI(args.writtenResponse);

      // Update English proficiency score
      await ctx.runMutation(api.vetting.mutations.updateEnglishWrittenScore, {
        vettingResultId: args.vettingResultId,
        writtenResponseScore: score,
      });

      return { score };
    } catch (error) {
      console.error("Failed to grade written response:", error);
      // Use fallback score if AI fails
      const fallbackScore = calculateFallbackScore(args.writtenResponse);
      await ctx.runMutation(api.vetting.mutations.updateEnglishWrittenScore, {
        vettingResultId: args.vettingResultId,
        writtenResponseScore: fallbackScore,
      });
      return { score: fallbackScore };
    }
  },
});

/**
 * Execute coding challenge using Judge0
 */
export const executeCodingChallenge = action({
  args: {
    code: v.string(),
    language: v.string(),
    testCases: v.array(
      v.object({
        input: v.string(),
        expectedOutput: v.string(),
        isHidden: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Judge0 only needs input/expectedOutput; strip isHidden
    const testCasesForJudge0 = args.testCases.map(({ input, expectedOutput }) => ({
      input,
      expectedOutput,
    }));
    const results = await executeWithJudge0({
      code: args.code,
      language: args.language,
      testCases: testCasesForJudge0,
    });

    return results;
  },
});

/**
 * Authoritative coding submission. Unlike the interactive "Run" path, this
 * re-executes the submitted code server-side against the prompt's test cases
 * (loaded from the DB, never trusting client-provided results) and then stores
 * the verified result on the session. This guarantees the grade and the
 * downstream failure feedback are based on a real run of the submitted code.
 */
export const submitCodingChallenge = action({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    promptId: v.id("vettingCodingPrompts"),
    code: v.string(),
    language: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.runQuery(
      internal.vetting.queries.getCodingPromptTestCasesInternal,
      { promptId: args.promptId }
    );

    const testCases = (prompt?.testCases ?? []).map(
      ({ input, expectedOutput }: { input: string; expectedOutput: string }) => ({
        input,
        expectedOutput,
      })
    );

    let runResult:
      | {
          passed: number;
          total: number;
          results: Array<{
            passed: boolean;
            input: string;
            expectedOutput: string;
            actualOutput: string;
            error?: string;
            status?: string;
            failureType?: string;
          }>;
        }
      | undefined;

    if (testCases.length > 0) {
      runResult = await executeWithJudge0({
        code: args.code,
        language: args.language,
        testCases,
      });
    }

    const stored = await ctx.runMutation(
      internal.vetting.mutations.storeCodingSubmissionInternal,
      {
        sessionId: args.sessionId,
        promptId: args.promptId,
        code: args.code,
        runResult,
        userId: args.userId,
      }
    );

    return { ...stored, runResult };
  },
});

/**
 * Grade written English response using OpenAI GPT-4
 * Evaluates grammar, vocabulary, coherence, and overall writing quality
 */
async function gradeWithAI(writtenResponse: string): Promise<number> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const prompt = `You are an expert English language assessor evaluating a written response for a freelancer verification test.

Evaluate the following written response on a scale of 0-100 based on:
1. Grammar and syntax (30 points): Correct use of grammar, sentence structure, and syntax
2. Vocabulary and word choice (20 points): Appropriate and varied vocabulary
3. Coherence and organization (25 points): Logical flow, clear structure, and organization
4. Clarity and communication (15 points): Clear expression of ideas, easy to understand
5. Overall quality (10 points): Professional tone, appropriate for business context

Written Response:
"""
${writtenResponse}
"""

Provide ONLY a numeric score from 0-100. Do not include any explanation, just the number.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for best quality assessment
      messages: [
        {
          role: "system",
          content:
            "You are a professional English language assessor. Always respond with only a numeric score from 0-100.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 10, // Only need the score number
    });

    const scoreText = completion.choices[0]?.message?.content?.trim() || "";
    const score = parseInt(scoreText, 10);

    // Validate score is within range
    if (isNaN(score) || score < 0 || score > 100) {
      // Fallback to basic scoring if AI returns invalid response
      return calculateFallbackScore(writtenResponse);
    }

    return score;
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to basic scoring if API fails
    return calculateFallbackScore(writtenResponse);
  }
}

/**
 * Fallback scoring algorithm if AI service is unavailable
 */
function calculateFallbackScore(writtenResponse: string): number {
  let score = 50; // Base score

  // Length check (minimum 100 words)
  const wordCount = writtenResponse.split(/\s+/).length;
  if (wordCount >= 100) {
    score += 20;
  } else if (wordCount >= 50) {
    score += 10;
  }

  // Structure check (paragraphs, sentences)
  const paragraphs = writtenResponse.split(/\n\n/).length;
  const sentences = writtenResponse.split(/[.!?]+/).length;
  if (paragraphs >= 2 && sentences >= 5) {
    score += 15;
  }

  // Grammar indicators (capitalization, punctuation)
  const hasProperCapitalization = /^[A-Z]/.test(writtenResponse);
  const hasPunctuation = /[.!?]/.test(writtenResponse);
  if (hasProperCapitalization && hasPunctuation) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Execute coding challenge using Judge0 API
 * Documentation: https://ce.judge0.com/
 */
async function executeWithJudge0(params: {
  code: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}): Promise<{
  passed: number;
  total: number;
  results: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    status?: string;
    failureType?: string;
  }>;
}> {
  const JUDGE0_API_URL =
    process.env.JUDGE0_API_URL || "https://api.judge0.com";
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
  const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
  const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

  if (!JUDGE0_API_KEY && !JUDGE0_RAPIDAPI_KEY) {
    throw new Error("Judge0 API key not configured");
  }

  // Map language to Judge0 language ID
  const languageId = mapLanguageToJudge0Id(params.language);

  const results: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    status?: string;
    failureType?: string;
  }> = [];

  // Execute each test case
  for (const testCase of params.testCases) {
    try {
      const submission = await submitToJudge0({
        code: params.code,
        languageId,
        input: testCase.input,
        apiUrl: JUDGE0_API_URL,
        apiKey: JUDGE0_API_KEY,
        rapidApiKey: JUDGE0_RAPIDAPI_KEY,
        rapidApiHost: JUDGE0_RAPIDAPI_HOST,
      });

      const statusId = submission.status?.id;
      const statusDescription = submission.status?.description || "";
      const actualOutput = submission.stdout?.trim() || "";
      const errorText =
        submission.stderr || submission.compile_output || submission.message || undefined;
      const passed = statusId === 3 && actualOutput === testCase.expectedOutput.trim();

      results.push({
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        error: errorText,
        status: statusDescription,
        failureType: passed
          ? undefined
          : classifyJudge0Failure(statusId, actualOutput, testCase.expectedOutput.trim()),
      });
    } catch (error) {
      results.push({
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "",
        error: error instanceof Error ? error.message : "Execution failed",
        failureType: "execution_error",
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;

  return {
    passed,
    total: params.testCases.length,
    results,
  };
}

/**
 * Submit code to Judge0 API
 * - Direct Judge0 (ce.judge0.com / api.judge0.com): use X-Auth-Token
 * - RapidAPI: use X-RapidAPI-Key and X-RapidAPI-Host
 * - When wait=true is not supported (e.g. official api.judge0.com), poll for result
 */
async function submitToJudge0(params: {
  code: string;
  languageId: number;
  input: string;
  apiUrl: string;
  apiKey?: string;
  rapidApiKey?: string;
  rapidApiHost?: string;
}): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Direct Judge0 API uses X-Auth-Token; RapidAPI uses X-RapidAPI-Key + X-RapidAPI-Host
  if (params.rapidApiKey && params.rapidApiHost) {
    headers["X-RapidAPI-Key"] = params.rapidApiKey;
    headers["X-RapidAPI-Host"] = params.rapidApiHost;
  } else if (params.apiKey) {
    headers["X-Auth-Token"] = params.apiKey;
  }

  const baseUrl = params.apiUrl.replace(/\/$/, "");
  const submitUrl = `${baseUrl}/submissions?wait=true`;

  let submitResponse = await fetch(submitUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: params.code,
      language_id: params.languageId,
      stdin: params.input,
    }),
  });

  let submission: any;

  // If wait is not allowed (e.g. official api.judge0.com), submit without wait and poll
  if (submitResponse.status === 400) {
    const errBody = await submitResponse.text();
    if (errBody.includes("wait not allowed") || errBody.includes("wait")) {
      const noWaitResponse = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_code: params.code,
          language_id: params.languageId,
          stdin: params.input,
        }),
      });
      if (!noWaitResponse.ok) {
        const errorText = await noWaitResponse.text();
        throw new Error(`Judge0 submission failed: ${errorText}`);
      }
      const created = await noWaitResponse.json();
      const token = created.token;
      if (!token) throw new Error("Judge0 did not return submission token");
      submission = await pollJudge0Submission(baseUrl, token, headers);
    } else {
      throw new Error(`Judge0 submission failed: ${errBody}`);
    }
  } else if (submitResponse.ok) {
    submission = await submitResponse.json();
  } else {
    const errorText = await submitResponse.text();
    throw new Error(`Judge0 submission failed: ${errorText}`);
  }

  // If we got a token but no status (async submit), poll
  if (submission.token && (submission.status?.id === undefined || submission.status?.id === 1 || submission.status?.id === 2)) {
    submission = await pollJudge0Submission(baseUrl, submission.token, headers);
  }

  // Return any terminal status (Accepted=3, Wrong Answer=4, TLE=5, Compile Error=6,
  // Runtime Errors>=7) so the caller can classify failure type instead of throwing.
  // Only queue/processing (1,2) or missing status are treated as failures here.
  if (submission.status?.id !== undefined && submission.status.id >= 3) {
    return submission;
  }
  throw new Error(`Execution failed: ${submission.status?.description || "Unknown status"}`);
}

/**
 * Classify a Judge0 failure into a coarse category used for feedback grounding.
 * Never exposes expected output; only the kind of failure.
 */
function classifyJudge0Failure(
  statusId: number | undefined,
  actualOutput: string,
  expectedOutput: string
): string {
  if (statusId === 6) return "compile_error";
  if (statusId === 5) return "timeout";
  if (statusId !== undefined && statusId >= 7) return "runtime_error";
  if (statusId === 4) return "wrong_output";
  if (statusId === 3 && actualOutput !== expectedOutput) return "wrong_output";
  return "error";
}

/** Poll Judge0 until submission is no longer In Queue (1) or Processing (2) */
async function pollJudge0Submission(
  baseUrl: string,
  token: string,
  headers: Record<string, string>,
  maxAttempts = 30,
  intervalMs = 1000
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${baseUrl}/submissions/${token}`, { headers });
    if (!res.ok) throw new Error(`Judge0 get submission failed: ${await res.text()}`);
    const submission = await res.json();
    const statusId = submission.status?.id;
    if (statusId !== 1 && statusId !== 2) return submission;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Judge0 execution timed out while polling");
}

/**
 * Map programming language to Judge0 language ID
 * Full list: https://ce.judge0.com/#statuses-and-languages-languages-get
 */
function mapLanguageToJudge0Id(language: string): number {
  const lower = language.toLowerCase().trim();

  // Handle languages whose symbols are stripped by alpha-only normalization
  if (lower === "c++" || lower === "c++17" || lower === "c++14" || lower === "c++ 17")
    return 54; // C++ (GCC 9.2.0)
  if (lower === "c#" || lower === "c sharp") return 51; // C# (Mono)
  if (lower === "f#") return 87; // F# (Mono)
  if (lower === "visual basic" || lower === "vb.net" || lower === "vb") return 84; // VB.NET
  if (lower === "html/css" || lower === "html" || lower === "css") return 63; // run as JS (no native HTML runner)
  if (lower === "node.js" || lower === "node") return 63; // JavaScript (Node.js)
  if (lower === "r" || lower === "r language") return 80; // R

  const mapping: Record<string, number> = {
    // Web / scripting
    javascript: 63, // JavaScript (Node.js 12.14.0)
    typescript: 74, // TypeScript (3.7.4)
    php: 68, // PHP (7.4.1)
    ruby: 72, // Ruby (2.7.0)
    perl: 85, // Perl (5.28.1)
    lua: 64, // Lua (5.3.5)
    bash: 46, // Bash (5.0.0)
    shell: 46, // Bash (5.0.0)

    // General-purpose
    python: 71, // Python 3 (3.8.1)
    python3: 71, // Python 3 (3.8.1)
    python2: 70, // Python 2 (2.7.17)
    java: 62, // Java (OpenJDK 13.0.1)
    kotlin: 78, // Kotlin (1.3.70)
    scala: 81, // Scala (2.13.2)
    groovy: 88, // Groovy (3.0.3)
    clojure: 56, // Clojure (1.10.1)

    // Systems
    c: 50, // C (GCC 9.2.0)
    cpp: 54, // C++ (GCC 9.2.0)
    csharp: 51, // C# (Mono 6.6.0.161)
    go: 60, // Go
    golang: 60, // Go
    rust: 73, // Rust (1.40.0)
    swift: 83, // Swift (5.2.3)
    dart: 90, // Dart (2.19.2)
    d: 59, // D (DMD 2.089.1)
    objectivec: 79, // Objective-C (Clang 7.0.1)
    objc: 79, // Objective-C (Clang 7.0.1)
    assembly: 45, // Assembly (NASM 2.14.02)
    asm: 45, // Assembly (NASM 2.14.02)

    // Functional
    haskell: 61, // Erlang shares 61 — Haskell may not be on all instances; fallback safe
    erlang: 61, // Erlang (OTP 22.2)
    elixir: 60, // Elixir (1.9.4) — ID 60 on standard CE; overlaps with Go on some instances
    ocaml: 65, // OCaml (4.09.0)
    lisp: 58, // Common Lisp (SBCL 2.0.0)
    commonlisp: 58, // Common Lisp (SBCL 2.0.0)
    fsharp: 87, // F# (Mono)

    // Legacy / niche
    cobol: 57, // COBOL (GnuCOBOL 2.2)
    pascal: 67, // Pascal (FPC 3.0.4)
    basic: 47, // Basic (FreeBasic 1.07.1)
    prolog: 69, // Prolog (GNU Prolog 1.4.5)

    // Data / scientific
    r: 80, // R (4.0.0)
    octave: 66, // Octave (5.1.0)
    matlab: 66, // Octave as MATLAB-compatible runner
    sql: 82, // SQL (SQLite 3.27.2)
    sqlite: 82, // SQL (SQLite 3.27.2)

    // Blockchain
    solidity: 63, // No native Solidity runner; fall back to Node.js

    // UI frameworks — no dedicated runner, fall back to Node.js
    react: 63,
    vuejs: 63,
    angular: 63,
  };

  const normalized = lower.replace(/[^a-z]/g, "");
  return mapping[normalized] ?? 71; // Default to Python 3
}


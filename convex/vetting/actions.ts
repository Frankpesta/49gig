// @ts-nocheck
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = await executeWithJudge0({
      code: args.code,
      language: args.language,
      testCases: args.testCases,
    });

    return results;
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

      const actualOutput = submission.stdout?.trim() || "";
      const passed = actualOutput === testCase.expectedOutput.trim();

      results.push({
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        error: submission.stderr || submission.compile_output || undefined,
      });
    } catch (error) {
      results.push({
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "",
        error: error instanceof Error ? error.message : "Execution failed",
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

  if (submission.status?.id === 3) {
    return submission;
  }
  if (submission.status?.id === 6) {
    throw new Error(`Compilation error: ${submission.compile_output || "Unknown"}`);
  }
  if (submission.status?.id === 5) {
    throw new Error("Time limit exceeded");
  }
  if (submission.status?.id === 4) {
    throw new Error(`Wrong answer or runtime: ${submission.stderr || submission.message || "Unknown"}`);
  }
  if (submission.status?.id >= 7) {
    throw new Error(`Runtime error: ${submission.stderr || submission.message || submission.status?.description || "Unknown"}`);
  }
  throw new Error(`Execution failed: ${submission.status?.description || "Unknown status"}`);
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
  const mapping: Record<string, number> = {
    javascript: 63, // Node.js
    typescript: 74, // TypeScript
    python: 71, // Python 3
    java: 62, // Java
    cpp: 54, // C++17
    c: 50, // C
    csharp: 51, // C#
    go: 60, // Go
    rust: 73, // Rust
    php: 68, // PHP
    ruby: 72, // Ruby
    swift: 83, // Swift
    kotlin: 78, // Kotlin
  };

  const normalized = language.toLowerCase().replace(/[^a-z]/g, "");
  return mapping[normalized] || 71; // Default to Python 3
}


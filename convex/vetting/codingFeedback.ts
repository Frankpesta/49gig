// @ts-nocheck
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import OpenAI from "openai";

type ChallengeInput = {
  title: string;
  description: string;
  language: string;
  code: string;
  passed: number;
  total: number;
  failureTypes: string[];
  failedSummaries: Array<{ failureType: string; error?: string }>;
};

type ChallengeFeedback = {
  title: string;
  passedCases: number;
  totalCases: number;
  failureTypes: string[];
  coaching: string;
};

type CodingFeedback = {
  generatedAt: number;
  attemptRound: number;
  isFinal: boolean;
  overallSummary: string;
  challenges: ChallengeFeedback[];
};

/**
 * Generate AI coaching feedback for a freelancer's coding submission and deliver it.
 *
 * - Round 0 (retake offered): persist feedback to vettingResults + email a "feedback + retake" note.
 * - Final failure (isFinal): generate feedback, then terminate the account with the
 *   coaching attached to the termination email (so it goes out before deletion).
 *
 * Feedback is grounded in the authoritative Judge0 results (which cases failed,
 * the failure type, and any error text) plus the submitted code. It NEVER reveals
 * the expected test outputs.
 */
export const generateAndDeliverCodingFeedback = internalAction({
  args: {
    freelancerId: v.id("users"),
    vettingResultId: v.id("vettingResults"),
    attemptRound: v.number(),
    isFinal: v.boolean(),
    reason: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let feedback: CodingFeedback | null = null;
    try {
      feedback = await buildFeedback(ctx, args);
    } catch (err) {
      console.error("[codingFeedback] failed to build feedback:", err);
    }

    if (args.isFinal) {
      // Terminate (hard delete) and carry the coaching into the termination email.
      await ctx.runMutation(
        internal.vetting.internalMutations.terminateFreelancerVerificationFailure,
        {
          freelancerId: args.freelancerId,
          vettingResultId: args.vettingResultId,
          reason: args.reason ?? "skills_below_minimum_after_retake",
          codingFeedback: feedback
            ? {
                overallSummary: feedback.overallSummary,
                challenges: feedback.challenges.map((c) => ({
                  title: c.title,
                  passedCases: c.passedCases,
                  totalCases: c.totalCases,
                  coaching: c.coaching,
                })),
              }
            : undefined,
        }
      );
      return { delivered: true, isFinal: true, hadFeedback: !!feedback };
    }

    // First-attempt failure: persist + email the retake feedback (only if coding feedback exists).
    if (feedback) {
      await ctx.runMutation(internal.vetting.mutations.saveCodingFeedbackInternal, {
        vettingResultId: args.vettingResultId,
        feedback,
      });

      if (args.email) {
        await ctx.runAction(internal.vetting.staffEmails.sendCodingFeedbackEmailInternal, {
          email: args.email,
          name: args.name ?? "there",
          overallSummary: feedback.overallSummary,
          challenges: feedback.challenges.map((c) => ({
            title: c.title,
            passedCases: c.passedCases,
            totalCases: c.totalCases,
            coaching: c.coaching,
          })),
        });
      }
    }

    return { delivered: !!feedback, isFinal: false, hadFeedback: !!feedback };
  },
});

/** Load the latest completed session, gather coding submissions, and produce coaching. */
async function buildFeedback(
  ctx: any,
  args: { freelancerId: any; attemptRound: number; isFinal: boolean }
): Promise<CodingFeedback | null> {
  const session = await ctx.runQuery(
    internal.vetting.queries.getLatestCompletedCodingSessionInternal,
    { freelancerId: args.freelancerId }
  );
  if (!session || session.pathType !== "coding_mcq") return null;

  const submissions: Array<{ promptId: any; code: string; runResult?: any }> =
    session.codingSubmissions ?? [];
  if (submissions.length === 0) return null;

  const promptIds = submissions.map((s) => s.promptId);
  const metas = await ctx.runQuery(internal.vetting.queries.getCodingPromptsMetaInternal, {
    promptIds,
  });
  const metaMap = new Map(metas.map((m: any) => [String(m.promptId), m]));

  const challengeInputs: ChallengeInput[] = submissions.map((sub) => {
    const meta: any = metaMap.get(String(sub.promptId));
    const r = sub.runResult as
      | { passed?: number; total?: number; results?: any[] }
      | undefined;
    const total = typeof r?.total === "number" ? r.total : 0;
    const passed = typeof r?.passed === "number" ? r.passed : 0;
    const results = Array.isArray(r?.results) ? r!.results! : [];
    const failed = results.filter((x: any) => !x.passed);
    const failureTypes = Array.from(
      new Set(failed.map((x: any) => x.failureType).filter(Boolean))
    ) as string[];
    // Only failure type + truncated error text — NEVER expectedOutput.
    const failedSummaries = failed.slice(0, 8).map((x: any) => ({
      failureType: (x.failureType as string) ?? "wrong_output",
      error: typeof x.error === "string" ? x.error.slice(0, 400) : undefined,
    }));
    return {
      title: meta?.title ?? "Coding challenge",
      description: (meta?.description ?? "").slice(0, 1500),
      language: session.selectedLanguage ?? "the chosen language",
      code: (sub.code ?? "").slice(0, 6000),
      passed,
      total,
      failureTypes,
      failedSummaries,
    };
  });

  const aiByIndex = await generateCoachingWithAI(challengeInputs);

  const challenges: ChallengeFeedback[] = challengeInputs.map((c, i) => ({
    title: c.title,
    passedCases: c.passed,
    totalCases: c.total,
    failureTypes: c.failureTypes,
    coaching: aiByIndex.challenges[i]?.coaching?.trim() || fallbackCoaching(c),
  }));

  const overallSummary =
    aiByIndex.overallSummary?.trim() || fallbackOverallSummary(challengeInputs);

  return {
    generatedAt: Date.now(),
    attemptRound: args.attemptRound,
    isFinal: args.isFinal,
    overallSummary,
    challenges,
  };
}

/**
 * Ask the LLM for constructive, per-challenge coaching. Returns aligned challenge
 * array + an overall summary. Falls back to deterministic guidance on any error.
 */
async function generateCoachingWithAI(
  challenges: ChallengeInput[]
): Promise<{ overallSummary: string; challenges: Array<{ coaching: string }> }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      overallSummary: fallbackOverallSummary(challenges),
      challenges: challenges.map((c) => ({ coaching: fallbackCoaching(c) })),
    };
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const challengesForModel = challenges.map((c, i) => ({
    index: i,
    title: c.title,
    language: c.language,
    problem: c.description,
    testsPassed: c.passed,
    testsTotal: c.total,
    failureTypes: c.failureTypes,
    // Only failure categories + truncated runtime/compiler errors. No expected outputs.
    failedCases: c.failedSummaries,
    submittedCode: c.code,
  }));

  const systemPrompt = `You are a senior software engineer giving kind, constructive feedback to a candidate who did not pass a timed coding assessment.

STRICT RULES:
- NEVER reveal, restate, or guess the expected/correct test outputs or provide a full working solution.
- Do NOT write the corrected code for them. You may reference small concepts, edge cases, or techniques.
- Ground every comment in the evidence provided (which tests failed, the failure type, and any error text). Do not invent failures that are not in the data.
- Be specific, actionable, and encouraging. 2-5 sentences per challenge.
- Focus on WHAT went wrong (e.g. unhandled edge cases, off-by-one, wrong data structure, time complexity / timeouts, compile/runtime errors) and HOW to think about fixing it.

Return STRICT JSON only, matching:
{
  "overallSummary": string,
  "challenges": [ { "index": number, "coaching": string } ]
}`;

  const userPrompt = `Here are the candidate's coding challenge results. Give per-challenge coaching and a short overall summary.

${JSON.stringify(challengesForModel, null, 2)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as {
      overallSummary?: string;
      challenges?: Array<{ index?: number; coaching?: string }>;
    };

    const byIndex: Array<{ coaching: string }> = challenges.map((c, i) => {
      const match = parsed.challenges?.find((p) => p.index === i);
      return { coaching: match?.coaching ?? fallbackCoaching(c) };
    });

    return {
      overallSummary: parsed.overallSummary ?? fallbackOverallSummary(challenges),
      challenges: byIndex,
    };
  } catch (err) {
    console.error("[codingFeedback] OpenAI error, using fallback:", err);
    return {
      overallSummary: fallbackOverallSummary(challenges),
      challenges: challenges.map((c) => ({ coaching: fallbackCoaching(c) })),
    };
  }
}

const FAILURE_TYPE_HINTS: Record<string, string> = {
  wrong_output:
    "your output didn't match what was expected on some inputs — re-check edge cases (empty input, large values, boundaries) and your output formatting.",
  runtime_error:
    "your code threw a runtime error on some inputs — guard against null/undefined access, out-of-range indexes, and invalid type operations.",
  timeout:
    "some cases exceeded the time limit — look for nested loops or repeated work you can avoid, and consider a more efficient algorithm or data structure.",
  compile_error:
    "your code failed to compile — fix the syntax/type errors and make sure it runs locally before submitting.",
  execution_error:
    "we couldn't execute some cases — make sure your program reads input from stdin and prints to stdout exactly as the prompt describes.",
  error:
    "some cases failed unexpectedly — verify your input parsing and output format match the prompt.",
};

function fallbackCoaching(c: ChallengeInput): string {
  if (c.total > 0 && c.passed === c.total) {
    return `Nice work — all ${c.total} test cases passed on "${c.title}". This challenge was not the weak point.`;
  }
  const intro =
    c.total > 0
      ? `You passed ${c.passed} of ${c.total} test cases on "${c.title}". `
      : `Your submission for "${c.title}" did not pass the automated tests. `;
  const hints = (c.failureTypes.length > 0 ? c.failureTypes : ["wrong_output"])
    .map((t) => FAILURE_TYPE_HINTS[t] ?? FAILURE_TYPE_HINTS.error)
    .slice(0, 3);
  return intro + "Focus on these areas: " + hints.join(" ");
}

function fallbackOverallSummary(challenges: ChallengeInput[]): string {
  const totalPassed = challenges.reduce((s, c) => s + c.passed, 0);
  const totalCases = challenges.reduce((s, c) => s + c.total, 0);
  if (totalCases === 0) {
    return "Your coding submission did not pass the automated tests. Review the per-challenge notes below, then practice the highlighted areas before trying again.";
  }
  return `Overall you passed ${totalPassed} of ${totalCases} coding test cases. Review the per-challenge notes below — focusing on edge cases, correctness, and efficiency will have the biggest impact next time.`;
}

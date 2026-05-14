"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const internalAny: any = require("../_generated/api").internal;
import OpenAI from "openai";

const MCQ_COUNT = 50;
const CODING_PROMPT_COUNT = 2;

const experienceLevelValidator = v.union(
  v.literal("junior"),
  v.literal("mid"),
  v.literal("senior"),
  v.literal("expert")
);

/**
 * Get or generate 50 skill MCQ questions for a category+skills+level.
 * Returns array of vettingMcqQuestions document IDs (order preserved for session).
 */
export const getOrGenerateSkillMcqQuestions = internalAction({
  args: {
    categoryId: v.string(),
    skillTopics: v.array(v.string()),
    experienceLevel: experienceLevelValidator,
    excludeQuestionIds: v.optional(v.array(v.id("vettingMcqQuestions"))),
  },
  handler: async (ctx, args): Promise<Id<"vettingMcqQuestions">[]> => {
    const existingIds: Id<"vettingMcqQuestions">[] = await ctx.runQuery(
      internalAny.vetting.internalQueries.getExistingMcqIds,
      {
        categoryId: args.categoryId,
        experienceLevel: args.experienceLevel,
        excludeIds: args.excludeQuestionIds,
      }
    );

    if (existingIds.length >= MCQ_COUNT) {
      return existingIds.slice(0, MCQ_COUNT);
    }

    const openai = getOpenAI();
    const difficulty = mapLevelToDifficulty(args.experienceLevel, args.categoryId);
    const topics =
      args.skillTopics.length > 0
        ? args.skillTopics.join(", ")
        : args.categoryId.replace(/_/g, " ");

    const questions = await generateMcqWithOpenAI(openai, {
      topics,
      difficulty,
      count: MCQ_COUNT,
      categoryId: args.categoryId,
      experienceLevel: args.experienceLevel,
      skillTopics: args.skillTopics,
      keySuffix:
        args.excludeQuestionIds && args.excludeQuestionIds.length > 0 ? ":retake" : "",
    });

    const ids: Id<"vettingMcqQuestions">[] = await ctx.runMutation(
      internalAny.vetting.internalMutations.insertVettingMcqBatch,
      { questions }
    );

    return ids;
  },
});

/**
 * Get or generate 2 coding prompts for category+language+level.
 */
export const getOrGenerateCodingPrompts = internalAction({
  args: {
    categoryId: v.string(),
    language: v.string(),
    experienceLevel: experienceLevelValidator,
    excludePromptIds: v.optional(v.array(v.id("vettingCodingPrompts"))),
  },
  handler: async (ctx, args): Promise<Id<"vettingCodingPrompts">[]> => {
    const existingIds: Id<"vettingCodingPrompts">[] = await ctx.runQuery(
      internalAny.vetting.internalQueries.getExistingCodingPromptIds,
      {
        categoryId: args.categoryId,
        language: args.language,
        experienceLevel: args.experienceLevel,
        excludeIds: args.excludePromptIds,
      }
    );

    if (existingIds.length >= CODING_PROMPT_COUNT) {
      return existingIds.slice(0, CODING_PROMPT_COUNT);
    }

    const openai = getOpenAI();
    const difficulty = mapLevelToDifficulty(args.experienceLevel, args.categoryId);
    const prompts = await generateCodingPromptsWithOpenAI(openai, {
      categoryId: args.categoryId,
      language: args.language,
      difficulty,
      count: CODING_PROMPT_COUNT,
      experienceLevel: args.experienceLevel,
      keySuffix:
        args.excludePromptIds && args.excludePromptIds.length > 0 ? ":retake" : "",
    });

    const ids: Id<"vettingCodingPrompts">[] = await ctx.runMutation(
      internalAny.vetting.internalMutations.insertVettingCodingBatch,
      { prompts }
    );

    return ids;
  },
});

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

function mapLevelToDifficulty(
  level: "junior" | "mid" | "senior" | "expert",
  categoryId?: string
): string {
  if (categoryId === "ui_ux_design") {
    return mapUiUxDifficulty(level);
  }
  switch (level) {
    case "junior":
      return "easy–medium fundamentals: minimal pure definitions; favor correct application in short scenarios with light judgment calls.";
    case "mid":
      return "firmly medium, often edging hard: ambiguous requirements, trade-offs, debugging-style reasoning typical of shipped work.";
    case "senior":
      return "mostly hard with expert-level outliers: systemic design, edge-case correctness, and subtle distractors that tempt experienced practitioners.";
    case "expert":
      return "deep expert: rare edge cases, cross-layer interactions, standards and failure modes seen only after years of ownership.";
    default:
      return "medium";
  }
}

/** UI/UX is MCQ-only for this stack — widen the gap sharply between tiers. */
function mapUiUxDifficulty(
  level: "junior" | "mid" | "senior" | "expert"
): string {
  switch (level) {
    case "junior":
      return [
        "UI/UX — JUNIOR: layout hierarchy, common patterns, typography scale basics, Nielsen heuristics at a recognition level, simple flow fixes.",
        "Use applied mini-scenarios (reading a rough wireframe, spotting obvious friction). Wrong answers plausible; avoid WCAG conformance nuance or research-program design.",
      ].join(" ");
    case "mid":
      return [
        "UI/UX — MID: information architecture, prototyping fidelity, empty/error/mobile states, form UX, heuristic evaluation with rationale.",
        "Basic accessibility reasoning (labels, focus, touch targets); qualitative vs quantitative trade-offs. Distractors = common practitioner mistakes.",
      ].join(" ");
    case "senior":
      return [
        "UI/UX — SENIOR: research validity (bias, sampling, moderation), synthesizing qualitative + quantitative signals, design systems at scale, tokens/consistency governance.",
        "WCAG 2.x intent-level knowledge (Conformance A/AA distinctions, SC categories), inclusive design tensions, pragmatic metrics (task success, SUS caveats).",
        "Questions ask for the BEST option under constraints; wrong answers reflect sophisticated-but-wrong reasoning.",
      ].join(" ");
    case "expert":
      return [
        "UI/UX — EXPERT: org-level UX strategy, experimentation ethics, accessibility program maturity, cross-functional/regulatory constraints, systemic remediation of design debt.",
        "Critique study designs and success metrics like a Staff/Principal IC. Avoid trivial tooling trivia.",
      ].join(" ");
    default:
      return mapUiUxDifficulty("mid");
  }
}

async function generateMcqWithOpenAI(
  openai: OpenAI,
  params: {
    topics: string;
    difficulty: string;
    count: number;
    categoryId: string;
    experienceLevel: string;
    skillTopics: string[];
    keySuffix?: string;
  }
): Promise<
  Array<{
    questionKey: string;
    categoryId: string;
    skillTopics: string[];
    experienceLevel: "junior" | "mid" | "senior" | "expert";
    questionIndex: number;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
  }>
> {
  const uiAugment =
    params.categoryId === "ui_ux_design"
      ? "\n- UI/UX: scenario-first stems (product + user + constraints). Distractors reflect real team disagreements. Do not ask pure definition-matching unless the concept must be applied immediately after."
      : "";

  const sys = `You are an expert technical assessor. Generate multiple-choice questions (MCQ) for skill verification.
Rules:
- Output valid JSON only, no markdown.
- Each question has: "question", "options" (array of 4 strings), "correctIndex" (0-based).
- Prioritize multi-step reasoning, edge cases, debugging scenarios, trade-offs, and applied problem solving — not textbook definitions.
- Do not repeat the same idea. Cover different aspects of the topics.${uiAugment}`;

  const user = `Difficulty calibration — follow strictly; every question must fit this band:
${params.difficulty}

Generate exactly ${params.count} MCQ questions on: ${params.topics}.
Return a JSON array of objects: [ { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 }, ... ]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.7,
    max_tokens: 16000,
  });

  const raw =
    completion.choices[0]?.message?.content?.trim()?.replace(/^```json?\s*|\s*```$/g, "") ?? "[]";
  let arr: Array<{ question: string; options: string[]; correctIndex: number }>;
  try {
    arr = JSON.parse(raw);
  } catch {
    arr = [];
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("OpenAI did not return valid MCQ array");
  }

  const keyPrefix = `${params.categoryId}:${params.skillTopics.join(",")}:${params.experienceLevel}:${params.keySuffix ?? ""}:`;
  const level = params.experienceLevel as "junior" | "mid" | "senior" | "expert";

  return arr.slice(0, params.count).map((item, i) => ({
    questionKey: `${keyPrefix}${i}`,
    categoryId: params.categoryId,
    skillTopics: params.skillTopics,
    experienceLevel: level,
    questionIndex: i,
    questionText: typeof item.question === "string" ? item.question : String(item.question),
    options: Array.isArray(item.options) && item.options.length >= 2
      ? item.options.slice(0, 4).map((o: any) => String(o))
      : ["A", "B", "C", "D"],
    correctOptionIndex: Math.min(
      Math.max(0, Number(item.correctIndex) || 0),
      3
    ),
  }));
}

async function generateCodingPromptsWithOpenAI(
  openai: OpenAI,
  params: {
    categoryId: string;
    language: string;
    difficulty: string;
    count: number;
    experienceLevel: "junior" | "mid" | "senior" | "expert";
    keySuffix?: string;
  }
): Promise<
  Array<{
    promptKey: string;
    categoryId: string;
    language: string;
    experienceLevel: "junior" | "mid" | "senior" | "expert";
    promptIndex: number;
    title: string;
    description: string;
    starterCode?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }>
> {
  const sys = `You are an expert technical assessor. Generate coding challenge prompts for ${params.language}.
Output valid JSON only. Each challenge has: "title", "description" (clear problem statement with constraints), "starterCode" (optional), "testCases" (array of { "input": string, "expectedOutput": string } - at least 2 test cases).
Favor algorithmic thinking, careful handling of edge cases, and realistic constraints — avoid trivial one-liners.`;

  const user = `Generate exactly ${params.count} coding challenges in ${params.language} for category ${params.categoryId}.
Difficulty: ${params.difficulty} (substantive problems; not beginner syntax drills).
For each challenge include testCases: array of at least 2 objects with "input" and "expectedOutput" (exact string the program should print for that input).
Return JSON array: [ { "title": "...", "description": "...", "starterCode": "optional", "testCases": [ { "input": "...", "expectedOutput": "..." } ] }, ... ]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.6,
    max_tokens: 4000,
  });

  const raw =
    completion.choices[0]?.message?.content?.trim()?.replace(/^```json?\s*|\s*```$/g, "") ?? "[]";
  let arr: Array<{
    title: string;
    description: string;
    starterCode?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }>;
  try {
    arr = JSON.parse(raw);
  } catch {
    arr = [];
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("OpenAI did not return valid coding prompts array");
  }

  const keyPrefix = `${params.categoryId}:${params.language}:${params.experienceLevel}:${params.keySuffix ?? ""}:`;
  return arr.slice(0, params.count).map((item, i) => {
    const testCases = Array.isArray(item.testCases)
      ? item.testCases
          .slice(0, 5)
          .filter(
            (tc: any) =>
              tc && typeof tc.input === "string" && typeof tc.expectedOutput === "string"
          )
          .map((tc: any) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      : undefined;
    return {
      promptKey: `${keyPrefix}${i}`,
      categoryId: params.categoryId,
      language: params.language,
      experienceLevel: params.experienceLevel,
      promptIndex: i,
      title: typeof item.title === "string" ? item.title : `Challenge ${i + 1}`,
      description:
        typeof item.description === "string" ? item.description : "Solve the problem.",
      starterCode:
        typeof item.starterCode === "string" && item.starterCode
          ? item.starterCode
          : undefined,
      testCases: testCases && testCases.length >= 1 ? testCases : undefined,
    };
  });
}

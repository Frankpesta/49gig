"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
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
  },
  handler: async (ctx, args): Promise<Id<"vettingMcqQuestions">[]> => {
    const existingIds: Id<"vettingMcqQuestions">[] = await ctx.runQuery(
      internal.vetting.internalQueries.getExistingMcqIds,
      { categoryId: args.categoryId, experienceLevel: args.experienceLevel }
    );

    if (existingIds.length >= MCQ_COUNT) {
      return existingIds.slice(0, MCQ_COUNT);
    }

    const openai = getOpenAI();
    const difficulty = mapLevelToDifficulty(args.experienceLevel);
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
    });

    const ids: Id<"vettingMcqQuestions">[] = await ctx.runMutation(
      internal.vetting.internalMutations.insertVettingMcqBatch,
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
  },
  handler: async (ctx, args): Promise<Id<"vettingCodingPrompts">[]> => {
    const existingIds: Id<"vettingCodingPrompts">[] = await ctx.runQuery(
      internal.vetting.internalQueries.getExistingCodingPromptIds,
      {
        categoryId: args.categoryId,
        language: args.language,
        experienceLevel: args.experienceLevel,
      }
    );

    if (existingIds.length >= CODING_PROMPT_COUNT) {
      return existingIds.slice(0, CODING_PROMPT_COUNT);
    }

    const openai = getOpenAI();
    const difficulty = mapLevelToDifficulty(args.experienceLevel);
    const prompts = await generateCodingPromptsWithOpenAI(openai, {
      categoryId: args.categoryId,
      language: args.language,
      difficulty,
      count: CODING_PROMPT_COUNT,
      experienceLevel: args.experienceLevel,
    });

    const ids: Id<"vettingCodingPrompts">[] = await ctx.runMutation(
      internal.vetting.internalMutations.insertVettingCodingBatch,
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
  level: "junior" | "mid" | "senior" | "expert"
): string {
  switch (level) {
    case "junior":
      return "easy to medium";
    case "mid":
      return "medium to hard";
    case "senior":
      return "hard";
    case "expert":
      return "very hard / expert";
    default:
      return "medium";
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
  const sys = `You are an expert technical assessor. Generate multiple-choice questions (MCQ) for skill verification.
Rules:
- Output valid JSON only, no markdown.
- Each question has: "question", "options" (array of 4 strings), "correctIndex" (0-based).
- Questions must be very hard and relevant to the topics and difficulty.
- Do not repeat the same idea. Cover different aspects of the topics.`;

  const user = `Generate exactly ${params.count} MCQ questions on: ${params.topics}.
Difficulty: ${params.difficulty}.
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

  const keyPrefix = `${params.categoryId}:${params.skillTopics.join(",")}:${params.experienceLevel}:`;
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
Output valid JSON only. Each challenge has: "title", "description" (clear problem statement), "starterCode" (optional), "testCases" (array of { "input": string, "expectedOutput": string } - at least 2 test cases so we can run automated tests).`;

  const user = `Generate exactly ${params.count} coding challenges in ${params.language} for category ${params.categoryId}.
Difficulty: ${params.difficulty}.
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

  const keyPrefix = `${params.categoryId}:${params.language}:${params.experienceLevel}:`;
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

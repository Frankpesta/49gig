/**
 * Portfolio-Based Scoring for Non-Development Skills
 * 
 * Since Judge0 only supports coding challenges, we use portfolio analysis
 * for technical writers, data scientists, designers, marketers, etc.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export type PortfolioCategory =
  | "technical_writing"
  | "data_science"
  | "ui_ux_design";

interface PortfolioItem {
  title: string;
  description: string;
  url?: string;
  fileUrl?: string;
  category: PortfolioCategory;
  tags: string[];
  metrics?: {
    views?: number;
    engagement?: number;
    conversions?: number;
    downloads?: number;
  };
}

/**
 * Score portfolio using AI analysis
 */
export const scorePortfolio = action({
  args: {
    portfolioItems: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        url: v.optional(v.string()),
        fileUrl: v.optional(v.string()),
        category: v.string(),
        tags: v.array(v.string()),
        metrics: v.optional(
          v.object({
            views: v.optional(v.number()),
            engagement: v.optional(v.number()),
            conversions: v.optional(v.number()),
            downloads: v.optional(v.number()),
          })
        ),
      })
    ),
    skillName: v.string(),
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("expert")
    ),
  },
  handler: async (ctx, args) => {
    // Call OpenAI to analyze portfolio
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Build scoring rubric based on experience level
    const rubric = getScoringRubric(args.skillName, args.experienceLevel);

    const prompt = buildPortfolioAnalysisPrompt(
      args.portfolioItems,
      args.skillName,
      args.experienceLevel,
      rubric
    );

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using mini for cost efficiency
          messages: [
            {
              role: "system",
              content:
                "You are an expert evaluator of professional portfolios. Analyze portfolios objectively and provide detailed scoring based on the provided rubric.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent scoring
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return {
        score: analysis.overallScore,
        breakdown: analysis.breakdown,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        feedback: analysis.feedback,
      };
    } catch (error) {
      console.error("Portfolio scoring error:", error);
      throw error;
    }
  },
});

/**
 * Get scoring rubric based on skill and experience level
 */
function getScoringRubric(
  skillName: string,
  experienceLevel: "junior" | "mid" | "senior" | "expert"
): Record<string, { weight: number; criteria: string[] }> {
  const baseRubric: Record<string, { weight: number; criteria: string[] }> = {
    quality: {
      weight: 0.3,
      criteria: [
        "Professional presentation",
        "Clear communication",
        "Attention to detail",
        "Technical accuracy",
      ],
    },
    relevance: {
      weight: 0.25,
      criteria: [
        "Relevance to skill area",
        "Demonstrates required competencies",
        "Shows practical application",
      ],
    },
    impact: {
      weight: 0.25,
      criteria: [
        "Measurable results",
        "Business value",
        "User/client satisfaction",
      ],
    },
    complexity: {
      weight: 0.2,
      criteria: [
        "Project complexity",
        "Problem-solving approach",
        "Innovation and creativity",
      ],
    },
  };

  // Adjust criteria based on experience level
  if (experienceLevel === "junior") {
    baseRubric.complexity.weight = 0.1; // Less weight on complexity
    baseRubric.quality.weight = 0.4; // More weight on quality
  } else if (experienceLevel === "expert") {
    baseRubric.complexity.weight = 0.3; // More weight on complexity
    baseRubric.impact.weight = 0.3; // More weight on impact
  }

  // Skill-specific adjustments
  if (skillName.toLowerCase().includes("writing")) {
    baseRubric.quality.weight = 0.4;
    baseRubric.relevance.weight = 0.3;
    baseRubric.impact.weight = 0.2;
    baseRubric.complexity.weight = 0.1;
  } else if (skillName.toLowerCase().includes("data")) {
    baseRubric.impact.weight = 0.3;
    baseRubric.complexity.weight = 0.3;
    baseRubric.quality.weight = 0.25;
    baseRubric.relevance.weight = 0.15;
  } else if (skillName.toLowerCase().includes("design")) {
    baseRubric.quality.weight = 0.35;
    baseRubric.complexity.weight = 0.25;
    baseRubric.impact.weight = 0.25;
    baseRubric.relevance.weight = 0.15;
  }

  return baseRubric;
}

/**
 * Build prompt for portfolio analysis
 */
function buildPortfolioAnalysisPrompt(
  portfolioItems: any[],
  skillName: string,
  experienceLevel: string,
  rubric: Record<string, { weight: number; criteria: string[] }>
): string {
  const portfolioSummary = portfolioItems
    .map(
      (item, idx) => `
Item ${idx + 1}:
- Title: ${item.title}
- Description: ${item.description}
- Category: ${item.category}
- Tags: ${item.tags.join(", ")}
${item.metrics ? `- Metrics: ${JSON.stringify(item.metrics)}` : ""}
${item.url ? `- URL: ${item.url}` : ""}
`
    )
    .join("\n");

  return `Analyze the following portfolio for a ${experienceLevel}-level ${skillName} professional.

Portfolio Items:
${portfolioSummary}

Scoring Rubric:
${Object.entries(rubric)
  .map(
    ([category, { weight, criteria }]) =>
      `- ${category} (${(weight * 100).toFixed(0)}% weight): ${criteria.join(", ")}`
  )
  .join("\n")}

Expected Standards by Experience Level:
- Junior: Basic competency, clear communication, some practical examples
- Mid-level: Good quality, relevant experience, measurable impact
- Senior: High quality, complex projects, significant impact
- Expert: Exceptional quality, innovative solutions, exceptional impact

Please provide a JSON response with the following structure:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "quality": <number 0-100>,
    "relevance": <number 0-100>,
    "impact": <number 0-100>,
    "complexity": <number 0-100>
  },
  "strengths": [<array of strings>],
  "weaknesses": [<array of strings>],
  "feedback": "<detailed feedback string>"
}

Be strict but fair. A junior-level portfolio should score 60-75, mid-level 70-85, senior 80-92, expert 90-100.`;
}

/**
 * Calculate portfolio score from breakdown
 */
export function calculatePortfolioScore(breakdown: {
  quality: number;
  relevance: number;
  impact: number;
  complexity: number;
}): number {
  const rubric = getScoringRubric("general", "mid");
  
  return Math.round(
    breakdown.quality * rubric.quality.weight +
      breakdown.relevance * rubric.relevance.weight +
      breakdown.impact * rubric.impact.weight +
      breakdown.complexity * rubric.complexity.weight
  );
}

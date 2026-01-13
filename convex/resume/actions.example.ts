// @ts-nocheck
"use node";

/**
 * EXAMPLE: Ready-to-use parser implementations
 * 
 * Copy the implementation you want into convex/resume/actions.ts
 * Replace lines 52-65 (the simulated parser stub)
 */

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// ============================================================================
// OPTION 1: OpenAI GPT-4o-mini (Cheapest, Fastest)
// ============================================================================
// Install: npm install openai pdf-parse
// Set secret: npx convex env set OPENAI_API_KEY sk-...

/*
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const parseResumeAndBuildBio = action({
  args: {
    userId: v.id("users"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(
      internal.resume.mutations.setResumeProcessing as any,
      { userId: args.userId, fileId: args.fileId }
    );

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      // Extract text from PDF
      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      const resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Resume appears to be empty or unreadable");
      }

      // Parse with OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cheaper option
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser. Extract structured information and create a compelling professional bio.",
          },
          {
            role: "user",
            content: `Extract key information from this resume and return a JSON object with these exact fields:
{
  "summary": "A compelling 2-3 sentence professional bio highlighting key strengths and experience",
  "skills": ["skill1", "skill2", "skill3"],
  "highlights": ["key achievement 1", "key achievement 2", "key achievement 3"],
  "experience": "X+ years" or "X years"
}

Resume text:
${resumeText.substring(0, 8000)}`, // Limit to avoid token limits
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent parsing
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseText);

      const parsedData = {
        source: "openai-gpt4o-mini",
        fileUrl,
        summary: parsed.summary || "Experienced professional with a strong track record of delivering quality work.",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        experience: parsed.experience || "Unknown",
        parsedAt: Date.now(),
        rawTextLength: resumeText.length,
      };

      const resumeBio = parsedData.summary;

      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio,
          resumeParsedData: parsedData,
          resumeStatus: "processed",
        }
      );

      return { success: true, resumeStatus: "processed" as const };
    } catch (error: any) {
      console.error("Resume parsing error:", error);
      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio: "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
          resumeParsedData: {
            parsedAt: Date.now(),
            error: error?.message || "Parsing failed",
            source: "openai-gpt4o-mini",
          },
          resumeStatus: "failed",
          error: error?.message,
        }
      );
      throw error;
    }
  },
});
*/

// ============================================================================
// OPTION 2: Anthropic Claude (High Quality)
// ============================================================================
// Install: npm install @anthropic-ai/sdk pdf-parse
// Set secret: npx convex env set ANTHROPIC_API_KEY sk-ant-...

/*
import Anthropic from "@anthropic-ai/sdk";
import pdfParse from "pdf-parse";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const parseResumeAndBuildBio = action({
  args: {
    userId: v.id("users"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(
      internal.resume.mutations.setResumeProcessing as any,
      { userId: args.userId, fileId: args.fileId }
    );

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      const resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Resume appears to be empty or unreadable");
      }

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract key information from this resume and return a JSON object:
{
  "summary": "A compelling 2-3 sentence professional bio",
  "skills": ["skill1", "skill2"],
  "highlights": ["achievement1", "achievement2"],
  "experience": "X+ years"
}

Resume:
${resumeText.substring(0, 8000)}`,
          },
        ],
      });

      const responseText = message.content[0].text;
      const parsed = JSON.parse(responseText);

      const parsedData = {
        source: "anthropic-claude",
        fileUrl,
        summary: parsed.summary || "Experienced professional.",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        experience: parsed.experience || "Unknown",
        parsedAt: Date.now(),
      };

      const resumeBio = parsedData.summary;

      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio,
          resumeParsedData: parsedData,
          resumeStatus: "processed",
        }
      );

      return { success: true, resumeStatus: "processed" as const };
    } catch (error: any) {
      console.error("Resume parsing error:", error);
      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio: "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
          resumeParsedData: {
            parsedAt: Date.now(),
            error: error?.message || "Parsing failed",
            source: "anthropic-claude",
          },
          resumeStatus: "failed",
          error: error?.message,
        }
      );
      throw error;
    }
  },
});
*/

// ============================================================================
// OPTION 3: Simple Text Extraction (No LLM - Free but Basic)
// ============================================================================
// Install: npm install pdf-parse
// No API key needed!

/*
import pdfParse from "pdf-parse";

export const parseResumeAndBuildBio = action({
  args: {
    userId: v.id("users"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(
      internal.resume.mutations.setResumeProcessing as any,
      { userId: args.userId, fileId: args.fileId }
    );

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      const resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Resume appears to be empty or unreadable");
      }

      // Simple extraction: take first 200 chars as summary
      const summary = resumeText
        .split("\n")
        .filter((line) => line.trim().length > 20)
        .slice(0, 3)
        .join(" ")
        .substring(0, 200) + "...";

      // Extract potential skills (look for common keywords)
      const skillKeywords = [
        "React", "TypeScript", "JavaScript", "Python", "Node.js",
        "AWS", "Docker", "Kubernetes", "SQL", "MongoDB",
        "UI/UX", "Design", "Marketing", "Sales", "Management",
      ];
      const foundSkills = skillKeywords.filter((skill) =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
      );

      const parsedData = {
        source: "pdf-text-extraction",
        fileUrl,
        summary: summary || "Experienced professional with a strong track record.",
        skills: foundSkills.length > 0 ? foundSkills : ["General Skills"],
        highlights: [],
        experience: "Unknown",
        parsedAt: Date.now(),
        rawText: resumeText.substring(0, 1000), // Store first 1000 chars
      };

      const resumeBio = parsedData.summary;

      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio,
          resumeParsedData: parsedData,
          resumeStatus: "processed",
        }
      );

      return { success: true, resumeStatus: "processed" as const };
    } catch (error: any) {
      console.error("Resume parsing error:", error);
      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio: "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
          resumeParsedData: {
            parsedAt: Date.now(),
            error: error?.message || "Parsing failed",
            source: "pdf-text-extraction",
          },
          resumeStatus: "failed",
          error: error?.message,
        }
      );
      throw error;
    }
  },
});
*/

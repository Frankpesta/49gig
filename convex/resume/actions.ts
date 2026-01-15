"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";
import type { Doc } from "../_generated/dataModel";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a signed upload URL for resume PDF uploads.
 * Only freelancers can upload resumes.
 * Supports both Convex Auth and session token authentication.
 */
export const getResumeUploadUrl = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    type UserWithoutPassword = Omit<Doc<"users">, "passwordHash">;
    let user: UserWithoutPassword | null = null;
    const runGetCurrentUser = ctx.runQuery as (
      query: unknown,
      args: Record<string, never>
    ) => Promise<UserWithoutPassword | null>;
    const runVerifySession = ctx.runQuery as (
      query: unknown,
      args: { sessionToken: string }
    ) => Promise<UserWithoutPassword | null>;
    // @ts-expect-error Generated api types are excessively deep for this cast
    const apiUnknown = api as unknown as Record<string, unknown>;
    const users = apiUnknown["users"] as Record<string, unknown>;
    const usersQueries = users["queries"] as Record<string, unknown>;
    const resume = apiUnknown["resume"] as Record<string, unknown>;
    const resumeQueries = resume["queries"] as Record<string, unknown>;
    const getCurrentUserQuery = usersQueries["getCurrentUserProfile"];
    const getUserBySessionTokenQuery = resumeQueries["getUserBySessionToken"];

    // Try Convex Auth first
    user = await runGetCurrentUser(getCurrentUserQuery, {});
    
    // If no Convex Auth user and session token provided, verify session token
    if (!user && args.sessionToken) {
      user = await runVerifySession(getUserBySessionTokenQuery, {
        sessionToken: args.sessionToken,
      });
    }

    if (!user) {
      throw new Error("Unauthorized");
    }
    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can upload resumes");
    }

    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});

/**
 * Parse a resume file and build a bio/profile snapshot using OpenAI GPT-4o-mini.
 * Extracts text from PDF, then uses LLM to structure the data into a professional bio.
 */
export const parseResumeAndBuildBio = action({
  args: {
    userId: v.id("users"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const setResumeProcessingMutation = api.resume.mutations.setResumeProcessing;
    const applyParsedResumeMutation = api.resume.mutations.applyParsedResumeData;
    // Mark processing
    await ctx.runMutation(setResumeProcessingMutation, {
      userId: args.userId,
      fileId: args.fileId,
    });

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) {
        throw new Error("Missing resume file");
      }

      // Step 1: Download PDF
      const pdfResponse = await fetch(fileUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBlob = Buffer.from(pdfBuffer);

      // Step 2: Upload PDF to OpenAI and use it directly in completion
      // OpenAI's API can process PDFs when uploaded as files
      const pdfFile = new File([pdfBlob], "resume.pdf", { type: "application/pdf" });
      
      // Upload file to OpenAI
      // OpenAI SDK expects File, Blob, or FileData type
      const uploadedFile = await openai.files.create({
        file: pdfFile as File,
        purpose: "assistants",
      });

      let resumeText = "";
      try {
        // Try to get file content (may not work for PDFs depending on OpenAI support)
        const fileContent = await openai.files.content(uploadedFile.id);
        resumeText = await fileContent.text();
      } catch {
        throw new Error(
          "PDF text extraction failed. Please ensure your resume PDF contains selectable text (not just images)."
        );
      }

      // Validate extracted text
      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Could not extract text from PDF. Please ensure your resume PDF contains selectable text (not just images).");
      }

      // Step 4: Parse with OpenAI GPT-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser. Extract structured information from resumes and create compelling professional bios. Always return valid JSON.",
          },
          {
            role: "user",
            content: `Extract key information from this resume and return a JSON object with these exact fields:
{
  "summary": "A compelling 2-3 sentence professional bio highlighting key strengths, experience, and value proposition",
  "skills": ["skill1", "skill2", "skill3", ...],
  "highlights": ["key achievement or experience 1", "key achievement or experience 2", "key achievement or experience 3"],
  "experience": "X+ years" or "X years" (e.g., "5+ years", "3 years")
}

Resume text:
${resumeText.substring(0, 8000)}`, // Limit to avoid token limits
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent parsing
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("OpenAI returned empty response");
      }

      // Parse JSON response
      let parsed: {
        summary?: string;
        skills?: string[];
        highlights?: string[];
        experience?: string;
      };
      try {
        parsed = JSON.parse(responseText) as {
          summary?: string;
          skills?: string[];
          highlights?: string[];
          experience?: string;
        };
      } catch (parseError) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`);
      }

      // Validate and structure parsed data
      const parsedData = {
        source: "openai-gpt4o-mini",
        fileUrl,
        summary: parsed.summary || "Experienced professional with a strong track record of delivering quality work.",
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : [], // Limit to 20 skills
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : [], // Limit to 5 highlights
        experience: parsed.experience || "Unknown",
        parsedAt: Date.now(),
        rawTextLength: resumeText.length,
        model: "gpt-4o-mini",
      };

      const resumeBio = parsedData.summary;

      // Step 3: Save parsed data
      await ctx.runMutation(applyParsedResumeMutation, {
        userId: args.userId,
        resumeBio,
        resumeParsedData: parsedData,
        resumeStatus: "processed",
      });

      console.log(`Successfully parsed resume for user ${args.userId}`);
      return { success: true, resumeStatus: "processed" as const };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Parsing failed";
      console.error(`Resume parsing error for user ${args.userId}:`, error);
      
      // Save error state
      await ctx.runMutation(applyParsedResumeMutation, {
        userId: args.userId,
        resumeBio:
          "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
        resumeParsedData: {
          parsedAt: Date.now(),
          error: errorMessage,
          source: "openai-gpt4o-mini",
        },
        resumeStatus: "failed",
        error: errorMessage,
      });

      // Re-throw error for logging/monitoring
      throw error;
    }
  },
});
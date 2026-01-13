// @ts-nocheck
"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";

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
    let user = null;

    // Try Convex Auth first
    user = await ctx.runQuery(api.auth.getCurrentUserQuery, {});
    
    // If no Convex Auth user and session token provided, verify session token
    if (!user && args.sessionToken) {
      user = await ctx.runQuery(
        // @ts-expect-error dynamic path casting
        api["auth/queries"].verifySession as any,
        { sessionToken: args.sessionToken }
      );
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
    // Mark processing
    await ctx.runMutation(
      // @ts-expect-error internal path casting
      internal.resume.mutations.setResumeProcessing as any,
      { userId: args.userId, fileId: args.fileId }
    );

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
      const uploadedFile = await openai.files.create({
        file: pdfFile as any,
        purpose: "assistants",
      });

      // Step 3: Use OpenAI to extract and parse the resume in one step
      // We'll use the file ID with Assistants API or use a completion that can reference files
      // Since chat completions don't directly support file attachments, we'll use a workaround:
      // Ask OpenAI to extract text from the PDF using the file ID
      
      // For now, let's use OpenAI's file content API to get text (if supported)
      // If not, we'll use a two-step process with Assistants API
      let resumeText = "";
      
      try {
        // Try to get file content (may not work for PDFs)
        const fileContent = await openai.files.content(uploadedFile.id);
        resumeText = await fileContent.text();
      } catch (fileError) {
        // If direct file content doesn't work, use Assistants API
        // Create a simple assistant to extract text
        const assistant = await openai.beta.assistants.create({
          name: "Resume Parser",
          instructions: "Extract all text content from the uploaded PDF file. Return only the raw text, no formatting or explanations.",
          model: "gpt-4o-mini",
          tools: [{ type: "code_interpreter" }],
        });

        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: "user",
              content: "Extract all text from the uploaded PDF resume file.",
              file_ids: [uploadedFile.id],
            },
          ],
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant.id,
        });

        // Wait for completion (simplified - in production, poll for status)
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        let attempts = 0;
        while (runStatus.status !== "completed" && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          attempts++;
        }

        if (runStatus.status === "completed") {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];
          if (lastMessage?.content[0]?.type === "text") {
            resumeText = lastMessage.content[0].text.value;
          }
        }

        // Clean up
        await openai.beta.assistants.del(assistant.id);
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
      let parsed;
      try {
        parsed = JSON.parse(responseText);
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
      await ctx.runMutation(
        // @ts-expect-error internal path casting
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio,
          resumeParsedData: parsedData,
          resumeStatus: "processed",
        }
      );

      console.log(`Successfully parsed resume for user ${args.userId}`);
      return { success: true, resumeStatus: "processed" as const };
    } catch (error: any) {
      console.error(`Resume parsing error for user ${args.userId}:`, error);
      
      // Save error state
      await ctx.runMutation(
        // @ts-expect-error internal path casting
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio:
            "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
          resumeParsedData: {
            parsedAt: Date.now(),
            error: error?.message || "Parsing failed",
            source: "openai-gpt4o-mini",
          },
          resumeStatus: "failed",
          error: error?.message,
        }
      );

      // Re-throw error for logging/monitoring
      throw error;
    }
  },
});
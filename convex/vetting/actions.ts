// @ts-nocheck
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import OpenAI from "openai";

/**
 * Process identity verification with Smile Identity or Dojah
 * This action handles the external API calls
 */
export const processIdentityVerification = action({
  args: {
    vettingResultId: v.id("vettingResults"),
    documentImageId: v.id("_storage"),
    selfieImageId: v.id("_storage"),
    documentType: v.string(),
    documentNumber: v.string(),
    provider: v.union(v.literal("smile_identity"), v.literal("dojah")),
  },
  handler: async (ctx, args) => {
    // Get the vetting result directly from database using a query
    // We need to create a helper query or use the internal database access
    // For now, we'll get it via the freelancer ID from the mutation
    // This will be called from the mutation which already has the vetting result
    // So we can skip this check here and rely on the mutation to pass the correct ID

    // Get file URLs from Convex storage
    const documentUrl = await ctx.storage.getUrl(args.documentImageId);
    const selfieUrl = await ctx.storage.getUrl(args.selfieImageId);

    if (!documentUrl || !selfieUrl) {
      throw new Error("Failed to get file URLs");
    }

    try {
      let verificationResult;

      if (args.provider === "smile_identity") {
        // Smile Identity API call
        verificationResult = await verifyWithSmileIdentity({
          documentUrl,
          selfieUrl,
          documentType: args.documentType,
          documentNumber: args.documentNumber,
        });
      } else {
        // Dojah API call (fallback)
        verificationResult = await verifyWithDojah({
          documentUrl,
          selfieUrl,
          documentType: args.documentType,
          documentNumber: args.documentNumber,
        });
      }

      // Update vetting result
      await ctx.runMutation(api.vetting.mutations.updateIdentityVerification, {
        vettingResultId: args.vettingResultId,
        status: verificationResult.verified ? "verified" : "failed",
        score: verificationResult.score,
        livenessCheck: verificationResult.livenessCheck,
        verifiedAt: verificationResult.verified ? Date.now() : undefined,
      });

      return {
        success: verificationResult.verified,
        score: verificationResult.score,
        livenessCheck: verificationResult.livenessCheck,
      };
    } catch (error) {
      // If primary provider fails, try fallback
      if (args.provider === "smile_identity") {
        try {
          const fallbackResult = await verifyWithDojah({
            documentUrl,
            selfieUrl,
            documentType: args.documentType,
            documentNumber: args.documentNumber,
          });

          await ctx.runMutation(api.vetting.mutations.updateIdentityVerification, {
            vettingResultId: args.vettingResultId,
            status: fallbackResult.verified ? "verified" : "failed",
            score: fallbackResult.score,
            livenessCheck: fallbackResult.livenessCheck,
            verifiedAt: fallbackResult.verified ? Date.now() : undefined,
            provider: "dojah",
          });

          return {
            success: fallbackResult.verified,
            score: fallbackResult.score,
            livenessCheck: fallbackResult.livenessCheck,
            provider: "dojah",
          };
        } catch (fallbackError) {
          // Both providers failed
          await ctx.runMutation(api.vetting.mutations.updateIdentityVerification, {
            vettingResultId: args.vettingResultId,
            status: "failed",
          });

          throw new Error(
            `Identity verification failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`
          );
        }
      } else {
        throw error;
      }
    }
  },
});

/**
 * Grade written English response using AI
 */
export const gradeWrittenResponse = action({
  args: {
    vettingResultId: v.id("vettingResults"),
    writtenResponse: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
    // For now, using a placeholder scoring algorithm

    const score = await gradeWithAI(args.writtenResponse);

    // Update English proficiency score
    await ctx.runMutation(api.vetting.mutations.updateEnglishWrittenScore, {
      vettingResultId: args.vettingResultId,
      writtenResponseScore: score,
    });

    return { score };
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
    // TODO: Integrate with Judge0 API
    // For now, using placeholder

    const results = await executeWithJudge0({
      code: args.code,
      language: args.language,
      testCases: args.testCases,
    });

    return results;
  },
});

// ========== Helper Functions (Placeholders - To be implemented) ==========

/**
 * Verify identity using Smile Identity API
 * Documentation: https://docs.smileidentity.com/
 */
async function verifyWithSmileIdentity(params: {
  documentUrl: string;
  selfieUrl: string;
  documentType: string;
  documentNumber: string;
}): Promise<{
  verified: boolean;
  score: number;
  livenessCheck: boolean;
}> {
  const SMILE_IDENTITY_API_KEY = process.env.SMILE_IDENTITY_API_KEY;
  const SMILE_IDENTITY_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID;
  const SMILE_IDENTITY_API_URL =
    process.env.SMILE_IDENTITY_API_URL || "https://api.smileidentity.com/v1";

  if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
    throw new Error("Smile Identity credentials not configured");
  }

  try {
    // Download images from URLs
    const documentResponse = await fetch(params.documentUrl);
    const selfieResponse = await fetch(params.selfieUrl);

    if (!documentResponse.ok || !selfieResponse.ok) {
      throw new Error("Failed to download images");
    }

    const documentBuffer = await documentResponse.arrayBuffer();
    const selfieBuffer = await selfieResponse.arrayBuffer();

    // Convert to base64
    const documentBase64 = Buffer.from(documentBuffer).toString("base64");
    const selfieBase64 = Buffer.from(selfieBuffer).toString("base64");

    // Prepare Smile Identity API request
    const timestamp = Date.now();
    const signature = await generateSmileIdentitySignature(
      SMILE_IDENTITY_API_KEY,
      timestamp
    );

    const requestBody = {
      partner_id: SMILE_IDENTITY_PARTNER_ID,
      timestamp: timestamp.toString(),
      signature: signature,
      job_type: 1, // Basic KYC job type
      user_id: `user_${Date.now()}`, // Unique user ID
      id_info: {
        first_name: "", // Will be extracted from document
        last_name: "", // Will be extracted from document
        country: "", // Will be extracted from document
        id_type: mapDocumentTypeToSmileIdType(params.documentType),
        id_number: params.documentNumber,
        entered: false, // Auto-extract from document
      },
      images: {
        selfie: selfieBase64,
        id_card: documentBase64,
      },
      options: {
        return_job_status: true,
        return_history: true,
        return_images: false,
      },
    };

    const response = await fetch(`${SMILE_IDENTITY_API_URL}/id_verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMILE_IDENTITY_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Smile Identity API error: ${errorText}`);
    }

    const result = await response.json();

    // Parse Smile Identity response
    const verified =
      result.ResultCode === "1012" || // Success
      result.ResultCode === "1013"; // Success with warnings
    const score = verified ? calculateVerificationScore(result) : 0;
    const livenessCheck = result.Liveness?.LivenessCheck === "PASS";

    return {
      verified,
      score,
      livenessCheck,
    };
  } catch (error) {
    console.error("Smile Identity verification error:", error);
    throw new Error(
      `Smile Identity verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate signature for Smile Identity API
 * Note: Smile Identity signature generation typically requires server-side crypto
 * This is a simplified version - adjust based on Smile Identity's actual requirements
 */
async function generateSmileIdentitySignature(
  apiKey: string,
  timestamp: number
): Promise<string> {
  // Smile Identity uses HMAC-SHA256 for signature
  // In production, implement proper HMAC-SHA256 using Node.js crypto module
  // For now, using a simplified approach that may need adjustment
  const crypto = await import("crypto");
  const message = `${apiKey}${timestamp}`;
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(message);
  return hmac.digest("base64");
}

/**
 * Map document type to Smile Identity format
 */
function mapDocumentTypeToSmileIdType(documentType: string): string {
  const mapping: Record<string, string> = {
    passport: "PASSPORT",
    "national_id": "NATIONAL_ID",
    "drivers_license": "DRIVERS_LICENSE",
    "voters_card": "VOTERS_CARD",
  };
  return mapping[documentType.toLowerCase()] || "NATIONAL_ID";
}

/**
 * Calculate verification score from Smile Identity response
 */
function calculateVerificationScore(result: any): number {
  let score = 0;

  // Document verification (40 points)
  if (result.DocumentVerification?.Verified) {
    score += 40;
  }

  // Face match (30 points)
  if (result.FaceMatch?.Match) {
    score += 30;
  }

  // Liveness check (20 points)
  if (result.Liveness?.LivenessCheck === "PASS") {
    score += 20;
  }

  // Data extraction (10 points)
  if (result.ExtractedData) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Verify identity using Dojah API (Fallback provider)
 * Documentation: https://dojah.io/docs
 */
async function verifyWithDojah(params: {
  documentUrl: string;
  selfieUrl: string;
  documentType: string;
  documentNumber: string;
}): Promise<{
  verified: boolean;
  score: number;
  livenessCheck: boolean;
}> {
  const DOJAH_API_KEY = process.env.DOJAH_API_KEY;
  const DOJAH_APP_ID = process.env.DOJAH_APP_ID;
  const DOJAH_API_URL = process.env.DOJAH_API_URL || "https://api.dojah.io";

  if (!DOJAH_API_KEY || !DOJAH_APP_ID) {
    throw new Error("Dojah credentials not configured");
  }

  try {
    // Download images from URLs
    const documentResponse = await fetch(params.documentUrl);
    const selfieResponse = await fetch(params.selfieUrl);

    if (!documentResponse.ok || !selfieResponse.ok) {
      throw new Error("Failed to download images");
    }

    const documentBuffer = await documentResponse.arrayBuffer();
    const selfieBuffer = await selfieResponse.arrayBuffer();

    // Convert to base64
    const documentBase64 = Buffer.from(documentBuffer).toString("base64");
    const selfieBase64 = Buffer.from(selfieBuffer).toString("base64");

    // Dojah KYC verification endpoint
    const response = await fetch(`${DOJAH_API_URL}/api/v1/kyc/document/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AppId": DOJAH_APP_ID,
        "Authorization": DOJAH_API_KEY,
      },
      body: JSON.stringify({
        document_type: mapDocumentTypeToDojahType(params.documentType),
        document_number: params.documentNumber,
        document_image: documentBase64,
        selfie_image: selfieBase64,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dojah API error: ${errorText}`);
    }

    const result = await response.json();

    // Parse Dojah response
    const verified = result.status === "success" && result.verified === true;
    const score = verified ? calculateDojahVerificationScore(result) : 0;
    const livenessCheck = result.liveness_check?.passed === true;

    return {
      verified,
      score,
      livenessCheck,
    };
  } catch (error) {
    console.error("Dojah verification error:", error);
    throw new Error(
      `Dojah verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Map document type to Dojah format
 */
function mapDocumentTypeToDojahType(documentType: string): string {
  const mapping: Record<string, string> = {
    passport: "PASSPORT",
    "national_id": "NATIONAL_ID",
    "drivers_license": "DRIVERS_LICENSE",
    "voters_card": "VOTERS_CARD",
  };
  return mapping[documentType.toLowerCase()] || "NATIONAL_ID";
}

/**
 * Calculate verification score from Dojah response
 */
function calculateDojahVerificationScore(result: any): number {
  let score = 0;

  // Document verification (40 points)
  if (result.document_verified) {
    score += 40;
  }

  // Face match (30 points)
  if (result.face_match?.match) {
    score += 30;
  }

  // Liveness check (20 points)
  if (result.liveness_check?.passed) {
    score += 20;
  }

  // Data extraction (10 points)
  if (result.extracted_data) {
    score += 10;
  }

  return Math.min(100, score);
}

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

  // Use RapidAPI if available, otherwise use direct API
  if (params.rapidApiKey && params.rapidApiHost) {
    headers["X-RapidAPI-Key"] = params.rapidApiKey;
    headers["X-RapidAPI-Host"] = params.rapidApiHost;
  } else if (params.apiKey) {
    headers["X-RapidAPI-Key"] = params.apiKey;
  }

  // Submit code
  const submitResponse = await fetch(`${params.apiUrl}/submissions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: params.code,
      language_id: params.languageId,
      stdin: params.input,
      wait: true, // Wait for execution to complete
    }),
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text();
    throw new Error(`Judge0 submission failed: ${errorText}`);
  }

  const submission = await submitResponse.json();

  // Check if execution completed successfully
  if (submission.status?.id === 3) {
    // Accepted
    return submission;
  } else if (submission.status?.id === 6) {
    // Compilation Error
    throw new Error(`Compilation error: ${submission.compile_output}`);
  } else if (submission.status?.id === 5) {
    // Time Limit Exceeded
    throw new Error("Time limit exceeded");
  } else if (submission.status?.id === 4) {
    // Runtime Error
    throw new Error(`Runtime error: ${submission.stderr}`);
  } else {
    throw new Error(`Execution failed with status: ${submission.status?.description}`);
  }
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


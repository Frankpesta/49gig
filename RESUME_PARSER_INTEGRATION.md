# Resume Parser Integration Guide

This guide explains how to replace the simulated parser stub with a real LLM/parser implementation and how cooldown enforcement works.

---

## 📍 Where the Parser Stub Lives

The parser stub is in **`convex/resume/actions.ts`** in the `parseResumeAndBuildBio` action, specifically **lines 52-65**.

```typescript
// CURRENT STUB (lines 52-65)
const parsedData = {
  source: "simulated-parser",
  fileUrl,
  highlights: [...],
  skills: [...],
  summary: "...",
  parsedAt: Date.now(),
};
```

---

## 🔄 How Cooldown Enforcement Works

### **Server-Side Enforcement** (Primary)
**Location:** `convex/resume/mutations.ts` - `completeResumeUpload` mutation (lines 28-36)

```typescript
// Enforce cooldown
const now = Date.now();
if (user.resumeCanReuploadAt && now < user.resumeCanReuploadAt) {
  const waitDays = Math.ceil((user.resumeCanReuploadAt - now) / (1000 * 60 * 60 * 24));
  throw new Error(`Reupload not allowed yet. Try again in ~${waitDays} day(s).`);
}
```

**How it works:**
- Checks `resumeCanReuploadAt` timestamp on the user record
- If current time < cooldown timestamp → throws error (blocks upload)
- Calculates remaining days for error message
- **This is the source of truth** - even if client-side checks are bypassed, server enforces it

### **Client-Side Enforcement** (UX Enhancement)
**Location:** `app/(auth)/resume-upload/page.tsx` (lines 44-50, 149-165)

```typescript
// Calculate cooldown state
const cooldownMs = resumeInfo?.resumeCanReuploadAt ? resumeInfo.resumeCanReuploadAt - now : 0;
const isCooldown = cooldownMs > 0;
const cooldownDays = Math.ceil(cooldownMs / (1000 * 60 * 60 * 24));

// Disable upload button and show message
{isCooldown && (
  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
    Resume reupload not available yet. Try again in ~{cooldownDays} day(s).
  </div>
)}
```

**How it works:**
- Fetches user's `resumeCanReuploadAt` via `getFreelancerResume` query
- Calculates remaining cooldown time
- **Disables upload button** and shows friendly message
- **Prevents unnecessary API calls** - better UX, but server is still the gatekeeper

---

## 🤖 Option 1: OpenAI GPT-4 Vision (Recommended)

### **Setup:**

1. **Install OpenAI SDK:**
```bash
npm install openai
```

2. **Add to `.env.local`:**
```env
OPENAI_API_KEY=sk-...
```

3. **Replace parser stub in `convex/resume/actions.ts`:**

```typescript
import OpenAI from "openai";

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
      if (!fileUrl) {
        throw new Error("Missing resume file");
      }

      // Download PDF as base64 or fetch URL
      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      // Call OpenAI Vision API
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview", // or "gpt-4o" if available
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract key information from this resume PDF and return a JSON object with:
- summary: A 2-3 sentence professional bio
- skills: Array of technical/professional skills
- highlights: Array of 3-5 key achievements or experiences
- experience: Years of experience (e.g., "5+ years")
- education: Highest education level (optional)
- certifications: Array of certifications (optional)

Return ONLY valid JSON, no markdown formatting.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseText);

      const parsedData = {
        source: "openai-gpt4-vision",
        fileUrl,
        summary: parsed.summary || "Experienced professional with a strong track record.",
        skills: parsed.skills || [],
        highlights: parsed.highlights || [],
        experience: parsed.experience,
        education: parsed.education,
        certifications: parsed.certifications || [],
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
      await ctx.runMutation(
        internal.resume.mutations.applyParsedResumeData as any,
        {
          userId: args.userId,
          resumeBio: "We couldn't parse this resume automatically. Please reupload a clean PDF or contact support.",
          resumeParsedData: {
            parsedAt: Date.now(),
            error: error?.message || "Parsing failed",
          },
          resumeStatus: "failed",
          error: error?.message,
        }
      );
      throw error;
    }
  },
});
```

**Note:** GPT-4 Vision may not support PDF directly. Alternative: Convert PDF to images first using a library like `pdf-poppler` or `pdf2pic`.

---

## 🤖 Option 2: Anthropic Claude (Alternative)

### **Setup:**

1. **Install Anthropic SDK:**
```bash
npm install @anthropic-ai/sdk
```

2. **Add to `.env.local`:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Replace parser stub:**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const parseResumeAndBuildBio = action({
  // ... same args
  handler: async (ctx, args) => {
    // ... same setup code

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      // Download and convert PDF to text first (use pdf-parse or similar)
      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      
      // Use pdf-parse to extract text
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      const resumeText = pdfData.text;

      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229", // or "claude-3-5-sonnet-20241022"
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract key information from this resume and return JSON:
{
  "summary": "2-3 sentence professional bio",
  "skills": ["skill1", "skill2"],
  "highlights": ["achievement1", "achievement2"],
  "experience": "X+ years"
}

Resume text:
${resumeText}`,
          },
        ],
      });

      const responseText = message.content[0].text;
      const parsed = JSON.parse(responseText);

      // ... rest same as OpenAI example
    } catch (error: any) {
      // ... error handling
    }
  },
});
```

---

## 📄 Option 3: PDF Text Extraction + LLM (Hybrid)

### **Setup:**

1. **Install dependencies:**
```bash
npm install pdf-parse openai
```

2. **Replace parser stub:**

```typescript
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const parseResumeAndBuildBio = action({
  // ... same args
  handler: async (ctx, args) => {
    // ... same setup

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      // Step 1: Extract text from PDF
      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      const resumeText = pdfData.text;

      // Step 2: Use LLM to structure the text
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cheaper option
        messages: [
          {
            role: "system",
            content: "You are a resume parser. Extract structured data from resumes.",
          },
          {
            role: "user",
            content: `Parse this resume text and return JSON:
{
  "summary": "2-3 sentence professional bio",
  "skills": ["skill1", "skill2"],
  "highlights": ["achievement1"],
  "experience": "X+ years"
}

Resume:
${resumeText}`,
          },
        ],
        response_format: { type: "json_object" }, // Force JSON output
      });

      const parsed = JSON.parse(completion.choices[0].message.content || "{}");

      const parsedData = {
        source: "pdf-parse+openai",
        fileUrl,
        summary: parsed.summary || "Experienced professional.",
        skills: parsed.skills || [],
        highlights: parsed.highlights || [],
        experience: parsed.experience,
        parsedAt: Date.now(),
        rawText: resumeText.substring(0, 1000), // Store first 1000 chars for reference
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
      // ... error handling
    }
  },
});
```

---

## 🔧 Option 4: Third-Party Resume Parser API

### **Examples:**
- **Affinda Resume Parser** (https://affinda.com)
- **RChilli Resume Parser** (https://rchilli.com)
- **Sovren Resume Parser** (https://sovren.com)

### **Example with Affinda:**

```typescript
export const parseResumeAndBuildBio = action({
  // ... same args
  handler: async (ctx, args) => {
    // ... same setup

    try {
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) throw new Error("Missing resume file");

      // Call Affinda API
      const pdfResponse = await fetch(fileUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();

      const affindaResponse = await fetch("https://api.affinda.com/v3/resumes", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AFFINDA_API_KEY}`,
          "Content-Type": "application/pdf",
        },
        body: pdfBuffer,
      });

      const affindaData = await affindaResponse.json();

      const parsedData = {
        source: "affinda",
        fileUrl,
        summary: affindaData.summary || "Experienced professional.",
        skills: affindaData.skills?.map((s: any) => s.name) || [],
        highlights: affindaData.workExperience?.slice(0, 5).map((w: any) => w.jobTitle) || [],
        experience: affindaData.totalYearsExperience?.toString() || "Unknown",
        parsedAt: Date.now(),
        rawData: affindaData, // Store full response
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
      // ... error handling
    }
  },
});
```

---

## 📋 Implementation Checklist

- [ ] Choose parser option (OpenAI, Anthropic, PDF+LLM, or third-party API)
- [ ] Install required npm packages
- [ ] Add API keys to `.env.local` (and Convex dashboard secrets)
- [ ] Replace parser stub in `convex/resume/actions.ts` (lines 52-65)
- [ ] Test with a sample resume PDF
- [ ] Handle edge cases (malformed PDFs, empty resumes, etc.)
- [ ] Add rate limiting if using paid APIs
- [ ] Monitor parsing success/failure rates
- [ ] Consider caching parsed results to avoid re-parsing

---

## 🔐 Environment Variables Setup

### **For Convex Actions (Node.js):**

Add secrets to Convex dashboard:
```bash
npx convex env set OPENAI_API_KEY sk-...
# or
npx convex env set ANTHROPIC_API_KEY sk-ant-...
```

Access in actions:
```typescript
const apiKey = process.env.OPENAI_API_KEY;
```

---

## 🧪 Testing the Parser

1. **Upload a test resume** via `/resume-upload`
2. **Check Convex logs** for parsing progress
3. **Verify `resumeStatus`** transitions: `uploaded` → `processing` → `processed`
4. **Check `resumeBio`** and `resumeParsedData` in database
5. **Test error handling** with invalid PDFs

---

## 💡 Best Practices

1. **Error Handling:** Always catch parsing errors and set `resumeStatus: "failed"` with helpful error messages
2. **Rate Limiting:** Add rate limits if using paid APIs to control costs
3. **Retry Logic:** Consider retrying failed parses (with exponential backoff)
4. **Validation:** Validate parsed data structure before saving
5. **Logging:** Log parsing attempts, successes, and failures for monitoring
6. **Cost Optimization:** Use cheaper models (e.g., `gpt-4o-mini`) for initial parsing, upgrade if needed

---

## 🚀 Quick Start (Recommended: OpenAI)

1. **Install:**
```bash
npm install openai pdf-parse
```

2. **Add secret:**
```bash
npx convex env set OPENAI_API_KEY your-key-here
```

3. **Replace lines 52-65** in `convex/resume/actions.ts` with Option 3 code above

4. **Test:** Upload a resume and check the logs!

---

**Questions?** Check Convex logs or test the parser action directly via Convex dashboard.

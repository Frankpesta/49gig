# Cooldown Enforcement Flow

This document explains how the 6-month resume reupload cooldown is enforced on both client and server sides.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ATTEMPTS TO UPLOAD                      │
│                      (resume-upload page)                       │
└────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE CHECK (UX)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Query: getFreelancerResume(userId)                   │   │
│  │    Returns: resumeCanReuploadAt timestamp                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. Calculate: cooldownMs = resumeCanReuploadAt - now      │   │
│  │    If cooldownMs > 0:                                    │   │
│  │      - Disable upload button                             │   │
│  │      - Show message: "Try again in ~X days"              │   │
│  │      - Prevent form submission                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
                    [User clicks Upload]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVER-SIDE CHECK (SECURITY)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Mutation: completeResumeUpload(fileId, ...)             │   │
│  │                                                           │   │
│  │ 1. Get current user from database                        │   │
│  │    const user = await getCurrentUser(ctx)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. Check cooldown:                                       │   │
│  │    if (user.resumeCanReuploadAt &&                       │   │
│  │        now < user.resumeCanReuploadAt) {                 │   │
│  │      throw Error("Reupload not allowed yet...")         │   │
│  │    }                                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                    ┌─────────┴─────────┐                          │
│                    │                   │                          │
│              [PASS] │                   │ [FAIL]                  │
│                    │                   │                          │
│                    ▼                   ▼                          │
│        ┌───────────────────┐  ┌──────────────────┐                │
│        │ Continue upload   │  │ Throw error      │                │
│        │ Set status:       │  │ Return to client │                │
│        │ "uploaded"        │  │ Show error msg   │                │
│        │                   │  │                  │                │
│        │ Set cooldown:     │  └──────────────────┘                │
│        │ now + 6 months    │                                      │
│        └───────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 Code Locations

### **Client-Side Enforcement**

**File:** `app/(auth)/resume-upload/page.tsx`

**Lines 44-50:** Cooldown calculation
```typescript
const now = Date.now();
const cooldownMs = resumeInfo?.resumeCanReuploadAt
  ? resumeInfo.resumeCanReuploadAt - now
  : 0;
const isCooldown = cooldownMs > 0;
const cooldownDays = Math.ceil(cooldownMs / (1000 * 60 * 60 * 24));
```

**Lines 149-165:** UI blocking
```typescript
{isCooldown && (
  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
    Resume reupload not available yet. Try again in ~{cooldownDays} day(s).
  </div>
)}
<Button disabled={isCooldown || isUploading}>
  {isCooldown ? "Reupload Not Available" : "Upload & Continue"}
</Button>
```

**Purpose:**
- ✅ Better UX (prevents unnecessary API calls)
- ✅ Immediate feedback to user
- ⚠️ **Can be bypassed** (user could modify frontend code)
- ⚠️ **Not secure** (server must enforce)

---

### **Server-Side Enforcement**

**File:** `convex/resume/mutations.ts`

**Lines 28-36:** Cooldown check
```typescript
// Enforce cooldown
const now = Date.now();
if (
  user.resumeCanReuploadAt &&
  now < user.resumeCanReuploadAt
) {
  const waitDays = Math.ceil(
    (user.resumeCanReuploadAt - now) / (1000 * 60 * 60 * 24)
  );
  throw new Error(`Reupload not allowed yet. Try again in ~${waitDays} day(s).`);
}
```

**Lines 56:** Set new cooldown after successful upload
```typescript
resumeCanReuploadAt: now + SIX_MONTHS_MS, // 6 months from now
```

**Purpose:**
- ✅ **Source of truth** (cannot be bypassed)
- ✅ **Secure** (enforced on server)
- ✅ **Reliable** (database-backed)

---

## 🔐 Security Model

### **Defense in Depth:**

1. **Client-Side (UX Layer)**
   - Prevents accidental uploads
   - Provides immediate feedback
   - Reduces server load
   - **Can be bypassed** ❌

2. **Server-Side (Security Layer)**
   - Enforced in database mutation
   - Cannot be bypassed
   - **Always checked** ✅

### **Why Both?**

```
Client-Side: "Hey, you can't upload yet" (friendly, fast)
     ↓
Server-Side: "Actually, you REALLY can't upload yet" (secure, final)
```

---

## 📊 Cooldown Timeline Example

```
Day 0:   User uploads resume
         └─> resumeCanReuploadAt = now + 180 days (6 months)

Day 30:  User tries to reupload
         └─> Client: "Try again in ~150 days" (disabled button)
         └─> Server: Would reject if called

Day 90:  User tries to reupload
         └─> Client: "Try again in ~90 days" (disabled button)
         └─> Server: Would reject if called

Day 180: Cooldown expires
         └─> Client: Upload button enabled ✅
         └─> Server: Upload allowed ✅
         └─> New upload sets new cooldown (Day 180 + 180 = Day 360)
```

---

## 🧪 Testing Cooldown

### **Test Client-Side Blocking:**

1. Upload a resume
2. Immediately try to upload again
3. **Expected:** Button disabled, message shown

### **Test Server-Side Enforcement:**

1. Upload a resume
2. Manually call `completeResumeUpload` mutation (bypassing frontend)
3. **Expected:** Error thrown: "Reupload not allowed yet..."

### **Test Cooldown Expiry:**

1. Manually set `resumeCanReuploadAt` to past date in database
2. Try to upload
3. **Expected:** Upload succeeds, new cooldown set

---

## 🔧 Modifying Cooldown Period

**Current:** 6 months (180 days)

**To change:** Edit `convex/resume/mutations.ts`:

```typescript
// Line 6
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months

// Change to 3 months:
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 3; // 3 months

// Or make it configurable:
const COOLDOWN_MONTHS = 6;
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 30 * COOLDOWN_MONTHS;
```

---

## 💡 Key Takeaways

1. **Server-side is the source of truth** - Always enforce cooldown in mutations
2. **Client-side improves UX** - Prevents unnecessary API calls and provides feedback
3. **Both work together** - Client prevents, server enforces
4. **Cooldown is set after successful upload** - Not before, not during
5. **Cooldown resets on each upload** - Each upload sets a new 6-month window

---

## 🚨 Common Issues

### **Issue:** "Cooldown not working"

**Check:**
- ✅ Is `resumeCanReuploadAt` being set in `completeResumeUpload`?
- ✅ Is server-side check running (check Convex logs)?
- ✅ Is timestamp format correct (milliseconds since epoch)?

### **Issue:** "Client shows wrong cooldown days"

**Check:**
- ✅ Is `getFreelancerResume` query returning `resumeCanReuploadAt`?
- ✅ Is calculation correct: `(resumeCanReuploadAt - now) / (1000 * 60 * 60 * 24)`?

### **Issue:** "User bypassed cooldown"

**Check:**
- ✅ Server-side enforcement must be in place
- ✅ Mutation should throw error, not just return a warning
- ✅ Check Convex logs for mutation calls

---

**Questions?** Check the code in `convex/resume/mutations.ts` and `app/(auth)/resume-upload/page.tsx`.

# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

## Required Variables

### Convex
```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```
Get this from your Convex dashboard after running `npx convex dev`

### Google OAuth (for authentication)
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/oauth/callback
```
**Note:** These should be set in Convex dashboard, not in `.env.local`

### Stripe (for payments)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Optional Variables (Third-Party Services)

### OpenAI (English Proficiency Grading)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
**Note:** This should be set in Convex dashboard, not in `.env.local`
Get your API key from: https://platform.openai.com/api-keys

### Smile Identity (Identity Verification)
```bash
SMILE_IDENTITY_API_KEY=your_smile_identity_api_key_here
SMILE_IDENTITY_PARTNER_ID=your_smile_identity_partner_id_here
SMILE_IDENTITY_API_URL=https://api.smileidentity.com/v1
```
**Note:** These should be set in Convex dashboard
Get your credentials from: https://docs.smileidentity.com/

### Dojah (Fallback Identity Verification)
```bash
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here
DOJAH_API_URL=https://api.dojah.io
```
**Note:** These should be set in Convex dashboard
Get your credentials from: https://dojah.io/

### Judge0 (Coding Challenges)
```bash
JUDGE0_API_URL=https://api.judge0.com
JUDGE0_API_KEY=your_judge0_api_key_here
# OR use RapidAPI:
JUDGE0_RAPIDAPI_KEY=your_rapidapi_key_here
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```
**Note:** These should be set in Convex dashboard
Get your API key from: https://ce.judge0.com/ or https://rapidapi.com/judge0-official/api/judge0-ce

## Platform Configuration

```bash
PLATFORM_FEE_PERCENTAGE=10
MILESTONE_AUTO_RELEASE_HOURS=48
MATCH_EXPIRATION_DAYS=7
```

## Getting Started

1. Copy this file to `.env.local`
2. Fill in the required variables
3. For Convex, run `npx convex dev` to get your deployment URL
4. For Stripe, create an account at https://stripe.com and get your API keys
5. Third-party services can be configured later as needed


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

### Flutterwave (for payments)
```bash
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key_here
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key_here
FLUTTERWAVE_WEBHOOK_SECRET=your_flutterwave_webhook_secret_here
```
**Note:** These should be set in Convex dashboard and Next.js environment variables

## Optional Variables (Third-Party Services)

### OpenAI (English Proficiency Grading)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
**Note:** This should be set in Convex dashboard, not in `.env.local`
Get your API key from: https://platform.openai.com/api-keys

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

### Resend (Transactional Email)
**Set in Convex Dashboard (Settings → Environment Variables):**
- Email sending runs in Convex, so the API key must be in Convex, not `.env.local`.

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
# Optional: override "from" address (default uses notifications.49gig.com)
RESEND_FROM_EMAIL=49GIG <noreply@notifications.49gig.com>
```

- **Domain:** Use the domain verified in Resend for your API key (e.g. `notifications.49gig.com`).
- Get your API key and verify your domain at: https://resend.com

---

### Pusher (Real-time Notifications)
```bash
# For Next.js frontend (.env.local)
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster_here
```

**For Convex Dashboard (Settings → Environment Variables):**
```bash
PUSHER_APP_ID=your_pusher_app_id_here
PUSHER_KEY=your_pusher_key_here
PUSHER_SECRET=your_pusher_secret_here
PUSHER_CLUSTER=your_pusher_cluster_here
```

**Note:** 
- The `PUSHER_KEY` and `PUSHER_CLUSTER` values should be the same for both Convex and `.env.local`
- Get your credentials from: https://dashboard.pusher.com/
- Create a new app in Pusher dashboard to get your keys

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


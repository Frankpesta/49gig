# Google Analytics Setup (Consent-First)

49GIG uses Google Analytics 4 with a consent-first approach. No tracking runs until the user explicitly accepts.

## Configuration

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to `.env.local`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

4. Restart the dev server

## How It Works

- **Consent banner**: Shown on first visit when GA is configured. User can Accept or Reject.
- **Storage**: Choice is stored in `localStorage` under `ga_consent`.
- **No tracking until consent**: The gtag script is only loaded after the user accepts.
- **Page views**: Automatically tracked on every route change when consented.
- **Custom events**: Use `useAnalytics().trackEvent(name, params)` in any client component.

## Cookie Preferences

Users can change their choice anytime at [/legal/cookie-policy](/legal/cookie-policy).

## Custom Events

```tsx
import { useAnalytics } from "@/hooks/use-analytics";

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleAction = () => {
    trackEvent("button_click", { button_name: "signup" });
  };
}
```

## Tracked Events

| Event | When | Params |
|-------|------|--------|
| `sign_up` | Client/freelancer signup, OAuth new user, verify-email | `method`, `role` |
| `login` | Email login, 2FA, OAuth returning user | `method` |
| `create_project` | Project created | `project_id`, `hire_type` |
| `edit_project` | Draft/pending project updated | `project_id` |
| `begin_checkout` | User proceeds to payment | `project_id`, `value`, `currency` |
| `purchase` | Initial payment success | `project_id`, `value` |
| `add_payment` | Top-up payment success | `project_id`, `value` |
| `accept_match` | Client selects freelancer(s) and confirms | `project_id`, `freelancer_count` |
| `schedule_session` | One-on-one session scheduled | `project_id`, `freelancer_count` |
| `sign_contract` | User signs project contract | `project_id`, `role` |
| `complete_project` | Project marked complete | `project_id` |
| `generate_lead` | Contact form submitted | `category` |
| `withdraw` | Wallet withdrawal initiated | `value`, `currency` |

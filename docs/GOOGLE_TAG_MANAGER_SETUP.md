# Google Tag Manager Setup — 49GIG

49GIG uses Google Tag Manager (GTM) with **Google Consent Mode v2**. GTM loads immediately with default consent denied; tags fire only after the user accepts analytics. This keeps the consent banner functional while respecting privacy.

---

## 1. Create GTM Account & Container

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Create a new **Container** for your website (Web)
3. Copy your Container ID (format: `GTM-XXXXXXX`)

## 2. Install GTM on Your Site

Add to `.env.local`:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Restart the dev server. The GTM snippet with Consent Mode v2 is automatically injected in the root layout before React.

**Implementation details:**
- `consent_default` is pushed with all four v2 parameters denied (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`)
- `wait_for_update: 500` gives the consent banner time to run
- When the user accepts, `consent_update` is pushed with all granted
- GTM loads immediately; tags inside GTM respect consent and fire only when granted

---

## 3. Configure Consent Mode in GTM

1. In GTM → **Admin** (gear icon) → **Container Settings**
2. Under **Tag Consent Configuration**, enable **Consent Overview** (or use a Consent Mode template from the [Community Template Gallery](https://tagmanager.google.com/gallery/#/?filter=consent&page=1))
3. Ensure tags that need consent have **Consent Settings** → "Additional consent checks" → require `analytics_storage` (GA4) or `ad_storage` (Meta, Google Ads)

Our site pushes consent via `gtag('consent', 'default', ...)` and `gtag('consent', 'update', ...)` before GTM loads. Tags that require consent will wait for `consent_update` with `analytics_storage` / `ad_storage` granted.

---

## 4. Create GA4 Configuration Tag

1. **Tags** → **New** → **Tag Configuration**
2. Choose **Google Analytics: GA4 Configuration**
3. **Measurement ID**: `G-XXXXXXXXXX` (from GA4 Admin → Data Streams)
4. **Triggering**: Create a trigger (see below)
5. **Consent Settings**: Set "Additional consent checks" to require `analytics_storage` granted
6. Save

**Trigger for GA4 Config:**
- **Trigger type**: Consent Initialization – All Pages  
  OR **Page View** – All Pages (if your consent setup allows)
- For consent-aware firing: Use **Consent Initialization** and ensure the tag fires only when `analytics_storage` is granted (via consent checks in the tag)

**Recommended:** Create a trigger **"All Pages - Consent Granted"** that fires on **All Pages** and add a consent check in the tag: require `analytics_storage` = granted.

---

## 5. Create GA4 Event Tags (Conversion Events)

Create separate GA4 Event tags for each conversion. Use **Google Analytics: GA4 Event** tag type.

| Our Event Name | GA4 Event Name | Trigger |
|----------------|----------------|---------|
| `sign_up` | `sign_up` | Custom Event = `sign_up` |
| `purchase` | `purchase` | Custom Event = `purchase` |
| `add_payment` | `purchase` (or custom) | Custom Event = `add_payment` |
| `generate_lead` | `generate_lead` | Custom Event = `generate_lead` |
| `begin_checkout` | `begin_checkout` | Custom Event = `begin_checkout` |
| `sign_contract` | `sign_up` or custom | Custom Event = `sign_contract` |

**Steps for each:**
1. **Tags** → **New** → **Google Analytics: GA4 Event**
2. **Configuration Tag**: Select your GA4 Configuration tag
3. **Event Name**: Use the GA4 event name (e.g. `sign_up`, `purchase`)
4. **Event Parameters**: Add parameters from the dataLayer (e.g. `project_id`, `value`, `currency`, `method`, `role`)
5. **Trigger**: Custom Event, Event name = our event (e.g. `sign_up`)
6. **Consent**: Require `analytics_storage` granted
7. Save

---

## 6. Create Meta Pixel Tag

1. **Tags** → **New** → **Tag Configuration**
2. Choose **Custom HTML**
3. Paste your Meta Pixel base code from [Meta Events Manager](https://business.facebook.com/events_manager):

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
```

4. **Trigger**: All Pages (or Consent Granted – All Pages)
5. **Consent**: Require `ad_storage` granted if you gate ads
6. Save

**Meta Conversion Event Mapping:**

| Our Event | Meta Standard Event |
|-----------|---------------------|
| `sign_up` | `CompleteRegistration` |
| `purchase` | `Purchase` |
| `add_payment` | `AddPaymentInfo` or `Purchase` |
| `generate_lead` | `Lead` |
| `begin_checkout` | `InitiateCheckout` |
| `sign_contract` | `AddPaymentInfo` |

Create **Custom HTML** or **Meta Pixel** event tags that fire on our Custom Events and call `fbq('track', 'EventName', {...})`. Use **Triggers** → **Custom Event** with the event names below.

---

## 7. Create Google Ads Conversion Tag

1. **Tags** → **New** → **Tag Configuration**
2. Choose **Google Ads Conversion Tracking**
3. **Conversion ID**: From Google Ads → Tools → Conversions
4. **Conversion Label**: From the same conversion
5. **Conversion Value** (optional): Use dataLayer variable `{{dlv - value}}` if available
6. **Trigger**: Create triggers for success events (see below)
7. **Consent**: Require `ad_storage` granted
8. Save

**Triggers for Google Ads conversions:**
- **Purchase**: Custom Event = `purchase`
- **Add Payment**: Custom Event = `add_payment`
- **Complete Registration**: Custom Event = `sign_up`
- **Lead**: Custom Event = `generate_lead`
- **Initiate Checkout**: Custom Event = `begin_checkout`

Create one conversion tag per conversion type, or use a single tag with multiple triggers if your setup allows.

---

## 8. Custom Events We Push (dataLayer)

Use these **exact** event names when creating **Custom Event** triggers in GTM:

| Event Name | When Fired | Typical Params |
|------------|------------|----------------|
| `page_view` | Route change (SPA) | `page_path`, `page_location`, `page_title` |
| `sign_up` | Client/freelancer signup, OAuth signup, verify-email success | `method`, `role`, `step` |
| `login` | User login | `method` |
| `create_project` | Project created | `project_id`, `hire_type` |
| `begin_checkout` | User proceeds to payment | `project_id`, `value`, `currency` |
| `purchase` | Payment success (initial fund) | `project_id`, `value`, `currency` |
| `add_payment` | Top-up / add payment success | `project_id`, `value`, `currency` |
| `accept_match` | Client selects freelancer(s) | `project_id`, `freelancer_count` |
| `sign_contract` | Contract signed | `project_id`, `role` |
| `complete_project` | Project marked complete | `project_id` |
| `generate_lead` | Contact form submitted | `category` |
| `withdraw` | Wallet withdrawal | `value`, `currency` |
| `edit_project` | Project edited | `project_id` |
| `schedule_session` | Session scheduled | `project_id`, `freelancer_count` |

---

## 9. Success Pages (Conversion Event Locations)

Conversion events are pushed on these success paths:

| Path | Event | Notes |
|------|-------|-------|
| `/dashboard/projects/[id]/payment/callback` | `purchase` or `add_payment` | Flutterwave success (`status=successful`) |
| `/dashboard/projects/[id]/payment/success` | `purchase` | Stripe success (`payment_intent`) |
| `/verify-email` | `sign_up` | After successful email verification |
| `/signup/client` | `sign_up` | After client signup (before verify-email if required) |
| `/signup/freelancer` | `sign_up` | After freelancer signup |
| `/oauth/callback` | `sign_up` or `login` | After OAuth (Google) |
| `/contact` | `generate_lead` | After contact form submit |
| `/dashboard/projects/[id]/payment` | `begin_checkout` | When user initiates payment |
| Contract view | `sign_contract` | When contract is signed |

---

## 10. Data Layer Variables (Optional)

Create these **Data Layer Variables** in GTM for use in tags:

| Variable Name | Data Layer Variable Name |
|---------------|--------------------------|
| `dlv - event` | `event` |
| `dlv - project_id` | `project_id` |
| `dlv - value` | `value` |
| `dlv - currency` | `currency` |
| `dlv - method` | `method` |
| `dlv - role` | `role` |
| `dlv - category` | `category` |

---

## 11. Quick Test

- Add `?accept_analytics=1` to the URL to auto-accept and load tracking (e.g. `https://49gig.com?accept_analytics=1`)
- Use GTM Preview mode to verify tags fire after consent
- Check GA4 Realtime and Meta Events Manager for events

---

## 12. Cookie Preferences

Users can change their choice at [/legal/cookie-policy](/legal/cookie-policy).

---

## 13. Verification Checklist

1. **Build**: Run `npm run build` — no errors.
2. **GTM loads**: Open DevTools → Network, filter by `gtm.js` — request to `googletagmanager.com` appears.
3. **Consent default**: In Console, `window.dataLayer` should show `['consent','default',{...}]` with all denied.
4. **Accept flow**: Click "Accept analytics" → `dataLayer` should show `['consent','update',{...}]` with all granted.
5. **Page view**: After consent, navigate → `dataLayer` should show `{event:'page_view',page_path:'/...'}`.
6. **GTM Preview**: Use GTM → Preview, enter your URL with `?accept_analytics=1` — verify tags fire.
7. **GA4 Realtime**: After consent, events appear in GA4 → Reports → Realtime.
8. **Meta Events Manager**: Check Events Manager for PageView and custom events.

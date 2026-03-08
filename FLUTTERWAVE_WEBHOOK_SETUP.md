# Flutterwave Webhook Setup Guide

## Quick Setup Steps

### 1. Generate a Secret Hash

Generate a secure random secret hash (32+ characters). You can use one of these methods:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Python:**
```python
import secrets
print(secrets.token_hex(32))
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 2. Set Environment Variable in Convex

**Required before configuring Flutterwave.** Set the secret hash in Convex:

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `FLUTTERWAVE_WEBHOOK_SECRET`
   - **Value:** (paste the secret hash from Step 1)
5. Click **Save**
6. Redeploy if needed: `npx convex deploy`

> **Note:** Convex also accepts `FLW_SECRET_HASH` as an alternative name.

### 3. Get Your Convex HTTP URL

1. In Convex Dashboard, go to **Settings** → **URLs**
2. Find your **HTTP Actions URL** (e.g. `https://your-deployment-123.convex.site`)
3. Your webhook path is: `https://<your-http-url>/flutterwave-webhook`
   - Example: `https://happy-animal-123.convex.site/flutterwave-webhook`

### 4. Configure Webhook in Flutterwave Dashboard

1. Log into your [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Navigate to **Settings** → **Webhooks** (or **Developers** → **Webhooks**)
3. Click **"Add Webhook"** or **"New Webhook"**
4. Fill in the webhook details:
   - **Webhook URL:** `https://<your-deployment>.convex.site/flutterwave-webhook`
     - Use the URL from Step 3 (your Convex HTTP Actions URL + `/flutterwave-webhook`)
   - **Secret Hash:** Paste the **exact same** secret hash from Step 1
     - ⚠️ **Critical:** Must match `FLUTTERWAVE_WEBHOOK_SECRET` in Convex
   - **Status:** Enable the webhook
5. Select events to listen for:
   - ✅ `charge.completed` - Payment completed
   - ✅ `transfer.completed` - Transfer/payout completed
   - ✅ `transfer.reversed` - Transfer reversed
   - ✅ `refund.completed` - Refund completed
6. Click **"Save"** or **"Create Webhook"**

### 5. Deploy Convex

Ensure your Convex functions (including the HTTP action) are deployed:

```bash
npx convex deploy
```

---

## Alternative: Next.js API Route

If you prefer to use the Next.js route instead of the Convex HTTP endpoint:

- **Webhook URL:** `https://your-domain.com/api/webhooks/flutterwave`
- **Environment variable:** Set `FLUTTERWAVE_WEBHOOK_SECRET` in Vercel (or your hosting) env vars

The Next.js route proxies to Convex. The Convex HTTP endpoint is recommended for reliability (no proxy, env vars in one place, direct processing).

## Security Best Practices

1. **Keep Secret Hash Secure:**
   - Never commit the secret hash to version control (Git)
   - Never share it publicly or in documentation
   - Use different secrets for development and production

2. **Use Strong Secrets:**
   - Minimum 32 characters
   - Use cryptographically secure random generators
   - Include uppercase, lowercase, numbers

3. **Rotate Secrets Periodically:**
   - Change the secret hash every 90-180 days
   - Update both Flutterwave dashboard and environment variables simultaneously

4. **Monitor Webhook Logs:**
   - Check for failed signature verifications
   - Investigate any unexpected webhook requests

## Testing Webhooks

### Local Testing

**Option A – Convex HTTP (recommended):**  
Your Convex HTTP endpoint is already public. Use your deployment’s HTTP URL:

```bash
# Get your HTTP URL from Convex Dashboard → Settings → URLs
# Then use: https://<deployment>.convex.site/flutterwave-webhook
```

**Option B – Next.js with ngrok:**  
If using the Next.js route for local testing:

```bash
npm install -g ngrok
npm run dev
# In another terminal:
ngrok http 3000
# Use: https://abc123.ngrok.io/api/webhooks/flutterwave
```

### Testing in Flutterwave Dashboard

1. Flutterwave provides a webhook testing tool in the dashboard
2. Use "Send Test Webhook" to verify your endpoint is receiving requests
3. Check your application logs to ensure webhooks are being processed

## Troubleshooting

### "Invalid signature" or "Unauthorized" errors

**Cause:** The secret hash doesn't match between Convex and Flutterwave.

**Solution:**
1. Convex Dashboard → Settings → Environment Variables: verify `FLUTTERWAVE_WEBHOOK_SECRET`
2. Flutterwave Dashboard → Webhooks: verify the **Secret Hash** matches exactly
3. No extra spaces, newlines, or characters
4. After changing Convex env vars, run `npx convex deploy`

### Webhooks not received

**Check:**
1. Webhook URL is correct and publicly accessible
2. Webhook is enabled in Flutterwave dashboard
3. Your server/firewall is not blocking incoming requests
4. SSL certificate is valid (HTTPS required)
5. Event types are enabled in Flutterwave dashboard

### Webhook received but not processed

**Check:**
1. Convex Dashboard → Logs for errors from the HTTP action or `handleFlutterwaveWebhook`
2. Webhook payload structure (supports `event`/`data`, `type`/`data`, or direct `status`/`tx_ref`)
3. Payment exists in DB for the given `tx_ref` (charge.completed)
4. Response returned within 60 seconds (Flutterwave retries on timeout)

## Additional Resources

- [Flutterwave Webhook Documentation](https://developer.flutterwave.com/docs/events)
- [Flutterwave Webhook Security](https://developer.flutterwave.com/docs/events/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

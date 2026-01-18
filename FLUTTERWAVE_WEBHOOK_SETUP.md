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

### 2. Configure Webhook in Flutterwave Dashboard

1. Log into your [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Navigate to **Settings** → **Webhooks** (or **Developers** → **Webhooks**)
3. Click **"Add Webhook"** or **"New Webhook"**
4. Fill in the webhook details:
   - **Webhook URL:** `https://your-domain.com/api/webhooks/flutterwave`
     - Replace `your-domain.com` with your actual domain
     - Example: `https://49gig.com/api/webhooks/flutterwave`
   - **Secret Hash:** Paste the secret hash you generated in Step 1
     - ⚠️ **Important:** This must be the exact same secret you'll use in Step 3
   - **Status:** Enable the webhook
5. Select events to listen for:
   - ✅ `charge.completed` - Payment completed
   - ✅ `transfer.completed` - Transfer/payout completed
   - ✅ `transfer.reversed` - Transfer reversed
   - ✅ `refund.completed` - Refund completed
6. Click **"Save"** or **"Create Webhook"**

### 3. Set Environment Variable

Set the **same secret hash** as an environment variable in your application:

**For Local Development (.env.local):**
```bash
FLUTTERWAVE_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**For Convex Dashboard:**
1. Go to your Convex Dashboard
2. Navigate to Settings → Environment Variables
3. Add:
   - **Name:** `FLUTTERWAVE_WEBHOOK_SECRET`
   - **Value:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

**For Production (Vercel/Other hosting):**
- Add the environment variable in your hosting platform's settings
- Use the same secret hash value

### 4. Verify Webhook Configuration

Your webhook handler (`app/api/webhooks/flutterwave/route.ts`) will:

1. Receive webhook requests from Flutterwave
2. Extract the `verif-hash` header (Flutterwave's signature)
3. Compute HMAC SHA512 hash using your `FLUTTERWAVE_WEBHOOK_SECRET`
4. Compare the computed hash with `verif-hash` header
5. Only process webhooks with matching signatures

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

For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL in Flutterwave dashboard:
# https://abc123.ngrok.io/api/webhooks/flutterwave
```

### Testing in Flutterwave Dashboard

1. Flutterwave provides a webhook testing tool in the dashboard
2. Use "Send Test Webhook" to verify your endpoint is receiving requests
3. Check your application logs to ensure webhooks are being processed

## Troubleshooting

### "Invalid signature" errors

**Cause:** The secret hash in your environment doesn't match the one in Flutterwave dashboard.

**Solution:**
1. Verify `FLUTTERWAVE_WEBHOOK_SECRET` in your environment
2. Verify the secret hash in Flutterwave dashboard
3. Ensure there are no extra spaces or characters
4. Restart your application/server after changing environment variables

### Webhooks not received

**Check:**
1. Webhook URL is correct and publicly accessible
2. Webhook is enabled in Flutterwave dashboard
3. Your server/firewall is not blocking incoming requests
4. SSL certificate is valid (HTTPS required)
5. Event types are enabled in Flutterwave dashboard

### Webhook received but not processed

**Check:**
1. Application logs for errors
2. Convex action `handleFlutterwaveWebhook` is working
3. Network connectivity between your server and Convex
4. Check webhook payload structure matches expected format

## Additional Resources

- [Flutterwave Webhook Documentation](https://developer.flutterwave.com/docs/events)
- [Flutterwave Webhook Security](https://developer.flutterwave.com/docs/events/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

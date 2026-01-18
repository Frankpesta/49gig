# Flutterwave Migration - Complete ✅

## Summary

Successfully migrated the entire payment system from Stripe to Flutterwave to support African markets.

## ✅ Completed Tasks

### 1. Schema Migration
- ✅ Updated `convex/schema.ts`: Replaced all Stripe fields with Flutterwave equivalents
  - `stripePaymentIntentId` → `flutterwaveTransactionId`
  - `stripeCustomerId` → `flutterwaveCustomerEmail`
  - `stripeAccountId` → `flutterwaveSubaccountId`
  - `stripeRefundId` → `flutterwaveRefundId`
  - `stripeTransferId` → `flutterwaveTransferId`
  - Removed `stripePayoutId` (Flutterwave uses transfers for payouts)

### 2. Core Payment Infrastructure
- ✅ Created `convex/payments/flutterwave.ts`: Flutterwave API helper functions
  - `initializePayment()` - Initialize Flutterwave payment
  - `verifyPayment()` - Verify payment transaction
  - `createRefund()` - Create refunds
  - `createSubaccount()` - Create freelancer subaccounts
  - `createTransfer()` - Transfer funds (payouts)
  - `getSubaccount()` - Get subaccount details
  - `getTransfer()` - Get transfer details

### 3. Payment Actions Migration
- ✅ Migrated `convex/payments/actions.ts`:
  - `createPaymentIntent` → Now uses Flutterwave payment initialization (returns payment link)
  - Added `verifyPayment` action for post-payment verification
  - `handleStripeWebhook` → `handleFlutterwaveWebhook` (updated event handling)
  - `refundPaymentIntent` → Updated to use Flutterwave refunds API
  - `createPayoutTransfer` → Updated to use Flutterwave transfers API (requires bank details)
  - Added `createSubaccount` for freelancer onboarding
  - Added `getSubaccountStatus` for checking freelancer account status

### 4. Queries & Mutations
- ✅ Updated `convex/payments/queries.ts`:
  - `getPaymentByIntentId` → `getPaymentByTransactionId` (uses tx_ref)
  - Updated indexes to use Flutterwave field names
- ✅ Updated `convex/payments/mutations.ts`:
  - `createPayment` mutation updated to use Flutterwave fields
  - `updateUserStripeId` → Removed (not needed with Flutterwave)
  - `updateUserStripeAccountId` → `updateUserFlutterwaveSubaccountId`
  - `handlePaymentSuccess/Failure/Cancellation` updated to use transaction IDs
  - `updatePaymentByTransferId` updated to use Flutterwave transfer IDs

### 5. Webhook Handler
- ✅ Created `app/api/webhooks/flutterwave/route.ts`:
  - Flutterwave signature verification (HMAC SHA512)
  - Event handling: `charge.completed`, `transfer.completed`, `transfer.reversed`
  - Integrated with Convex action `handleFlutterwaveWebhook`

## ⚠️ Important Notes

### Payment Flow Differences

1. **Payment Initialization:**
   - **Stripe**: Returns `clientSecret` for Stripe Elements integration
   - **Flutterwave**: Returns `paymentLink` - user is redirected to Flutterwave payment page

2. **Freelancer Payouts:**
   - **Stripe**: Uses Connect accounts → automatic payouts
   - **Flutterwave**: Requires bank details (bank code, account number) for each transfer
   - **Action**: `createPayoutTransfer` now requires `bankCode`, `accountNumber`, `accountName`

3. **Transaction References:**
   - **Stripe**: Uses Payment Intent IDs
   - **Flutterwave**: Uses `tx_ref` (transaction reference) - custom string format: `49gig-{projectId}-{timestamp}`

### Required Environment Variables

Update your `.env` or Convex environment variables:

```bash
# Remove Stripe
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=

# Add Flutterwave
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
CONVEX_SITE_URL=https://your-site.com  # Required for redirect URLs
```

### Webhook Configuration

1. **Generate a Webhook Secret Hash:**
   - Create a secure random string (32+ characters recommended)
   - You can generate one using: `openssl rand -hex 32` or any secure random string generator
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
   - **Keep this secret secure and never share it publicly**

2. **In Flutterwave Dashboard:**
   - Go to Settings → Webhooks (or Developers → Webhooks)
   - Click "Add Webhook" or "New Webhook"
   - Enter your webhook URL: `https://your-site.com/api/webhooks/flutterwave`
   - **Enter the Secret Hash:** Paste the secret you generated in step 1
   - Enable events:
     - `charge.completed` - For successful payments
     - `transfer.completed` - For successful transfers/payouts
     - `transfer.reversed` - For reversed transfers
     - `refund.completed` - For completed refunds

3. **Set Environment Variable:**
   - Add the **same secret hash** to your environment variables:
   ```bash
   FLUTTERWAVE_WEBHOOK_SECRET=your_secret_hash_here
   ```
   - **Important:** The secret hash in your environment must **exactly match** the one you entered in Flutterwave dashboard
   - Set this in:
     - `.env.local` for local development
     - Convex Dashboard → Settings → Environment Variables for production
     - Your hosting platform's environment variables (Vercel, etc.)

**How it works:**
- Flutterwave signs every webhook request using your secret hash
- The signature is sent in the `verif-hash` header
- Your webhook handler verifies the signature using `FLUTTERWAVE_WEBHOOK_SECRET`
- If signatures match, the webhook is authentic and processed

## 📋 Pending Tasks

### 9. Frontend Components (Needs Update)
- Update payment pages to use Flutterwave payment links instead of Stripe Elements
- Update settings page for Flutterwave subaccount management
- Add bank details form for freelancer payouts
- Update payment callback page to verify payment

### 10. Documentation
- Update README with Flutterwave setup instructions
- Update environment variable documentation
- Add Flutterwave API reference links

## 🔄 Migration Impact

### What Changed:
- Payment initialization now returns a redirect link
- Freelancer payouts require bank account details
- Webhook event structure is different
- Transaction references use `tx_ref` format

### What Stayed the Same:
- Payment flow logic (pre-funding, milestones, disputes)
- Escrow management
- Dispute resolution flow
- Audit logging
- Notification system

## 🚀 Next Steps

1. **Update Frontend:**
   - Replace Stripe Elements with Flutterwave payment link redirect
   - Update payment callback page
   - Add bank details form for freelancer payouts

2. **Testing:**
   - Test payment initialization
   - Test payment verification
   - Test refunds
   - Test freelancer payouts
   - Test webhook handling

3. **Environment Setup:**
   - Add Flutterwave credentials to Convex environment
   - Configure Flutterwave webhook URL
   - Test in Flutterwave sandbox mode first

## 📚 Resources

- [Flutterwave API Documentation](https://developer.flutterwave.com/docs)
- [Flutterwave Payment Integration](https://developer.flutterwave.com/docs/integration-guides/payments)
- [Flutterwave Transfers](https://developer.flutterwave.com/docs/transfers)
- [Flutterwave Subaccounts](https://developer.flutterwave.com/docs/subaccounts)

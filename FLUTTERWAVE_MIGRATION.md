# Flutterwave Migration Plan

## Overview
Complete migration from Stripe to Flutterwave payment gateway to support African markets where Stripe has limited coverage.

## Key Changes

### 1. API Mapping
- **Stripe Payment Intents** → **Flutterwave Payments API**
- **Stripe Connect** → **Flutterwave Subaccounts** (for freelancer payouts)
- **Stripe Webhooks** → **Flutterwave Webhooks**
- **Stripe Refunds** → **Flutterwave Refunds API**
- **Stripe Transfers** → **Flutterwave Transfers API**

### 2. Schema Changes
All `stripe*` fields replaced with `flutterwave*` fields:
- `stripePaymentIntentId` → `flutterwaveTransactionId`
- `stripeCustomerId` → `flutterwaveCustomerEmail` (Flutterwave uses email as customer identifier)
- `stripeAccountId` → `flutterwaveSubaccountId` (for freelancers)
- `stripeRefundId` → `flutterwaveRefundId`
- `stripeTransferId` → `flutterwaveTransferId`
- `stripePayoutId` → `flutterwaveTransferId` (unified)

### 3. Environment Variables
- `STRIPE_SECRET_KEY` → `FLUTTERWAVE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY` → `FLUTTERWAVE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET` → `FLUTTERWAVE_WEBHOOK_SECRET`

### 4. SDK Changes
- Remove: `stripe` package
- Add: Flutterwave SDK (`flutterwave-node-v3`) or REST API calls

### 5. Payment Flow Changes

#### Pre-funding:
- Stripe: Create Payment Intent → Client confirms → Webhook confirms
- Flutterwave: Initialize Payment → Redirect to payment page → Webhook confirms

#### Freelancer Payouts:
- Stripe: Transfer to Connect Account → Payout to Bank
- Flutterwave: Transfer to Subaccount → Payout to Bank (automatic or manual)

### 6. Files to Update
1. `convex/schema.ts` - Field renames
2. `convex/payments/actions.ts` - Complete rewrite
3. `convex/payments/mutations.ts` - Field updates
4. `convex/payments/queries.ts` - Index updates
5. `app/api/webhooks/stripe/route.ts` → `app/api/webhooks/flutterwave/route.ts`
6. Frontend payment components - Remove Stripe Elements, use Flutterwave Inline/Standard

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import * as flutterwave from "./flutterwave";
import { assertUsdCurrency } from "../currencyPolicy";

const internalAny: any = require("../_generated/api").internal;
const apiAny: any = require("../_generated/api").api;

/** Max age we treat a Flutterwave tx_ref as "same checkout" before allowing a fresh session. */
const PRE_FUNDING_IN_FLIGHT_MAX_MS = 60 * 60 * 1000;
/** If verify API errors, release pending rows older than this so the client is not blocked forever. */
const PRE_FUNDING_VERIFY_ERROR_RELEASE_MIN_AGE_MS = 15 * 60 * 1000;

function flutterwaveVerifyErrorLooksLikeNoTransaction(message: string): boolean {
  return /not\s*found|does\s*not\s*exist|invalid\s*(transaction|reference)|no\s*transaction|could\s*not\s*find|unknown\s*reference/i.test(
    message
  );
}

/**
 * Resolve the public-facing site URL we tell Flutterwave to redirect to after checkout.
 *
 * Flutterwave's Standard checkout requires a real, reachable redirect URL. A placeholder like
 * `https://your-site.com/...` also breaks return flows after pay/cancel. Additionally, a
 * `payment_options` filter that does not overlap what your dashboard enables (e.g. card-only
 * when USD card is off) can leave the hosted page with no usable methods—often surfaced as a
 * cancelled/abandoned session—so we omit `payment_options` and let Flutterwave use all enabled
 * channels for the currency.
 */
function resolveFrontendBaseUrl(): string {
  const raw =
    (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || "").trim();
  if (raw && !/your-site\.com/i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }
  const isTestMode =
    (process.env.FLUTTERWAVE_SECRET_KEY || "").startsWith("FLWSECK_TEST");
  if (isTestMode) {
    console.warn(
      "[payments] FRONTEND_URL / NEXT_PUBLIC_BASE_URL is not set. Falling back to http://localhost:3000 (Flutterwave test mode). Set FRONTEND_URL in your .env.local for staging/production."
    );
    return "http://localhost:3000";
  }
  throw new Error(
    "Server is not configured for live payments: set FRONTEND_URL (or NEXT_PUBLIC_BASE_URL) in the Convex dashboard so Flutterwave can redirect back after checkout."
  );
}

/** Build the customer payload Flutterwave Standard expects, falling back gracefully on missing fields. */
function buildFlutterwaveCustomer(user: {
  email?: string;
  name?: string;
  profile?: { phoneNumber?: string };
}): { email: string; name: string; phone_number?: string } {
  const email = (user.email || "").trim();
  if (!email) {
    throw new Error("Cannot start checkout: your account is missing an email address.");
  }
  const fallbackName = email.split("@")[0] || "Client";
  const name = (user.name || "").trim() || fallbackName;
  const phone = (user.profile?.phoneNumber || "").trim();
  return phone ? { email, name, phone_number: phone } : { email, name };
}

/** Flutterwave meta must be string values; non-strings have caused odd hosted-checkout behaviour. */
function flutterwaveStringMeta(meta: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

type PaymentSummary = {
  _id: Id<"payments">;
  projectId?: Id<"projects">;
  status: string;
  type: string;
  flutterwaveTransactionId?: string;
  createdAt: number;
} | null;

/**
 * Reconcile the latest pre_funding row with Flutterwave so failed/abandoned attempts
 * do not leave a perpetual "pending" row that blocks createPaymentIntent.
 */
async function refreshLatestPreFundingAgainstFlutterwave(
  ctx: any,
  projectId: Id<"projects">
): Promise<PaymentSummary> {
  let latest = (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
    projectId,
  })) as PaymentSummary;

  if (!latest || latest.type !== "pre_funding") return latest;
  if (latest.status === "succeeded") return latest;
  if (latest.status !== "pending" && latest.status !== "processing") return latest;

  const txRef = latest.flutterwaveTransactionId;
  if (!txRef) return latest;

  let verification: Awaited<ReturnType<typeof flutterwave.verifyPayment>>;
  try {
    verification = await flutterwave.verifyPayment(txRef);
  } catch {
    const age = Date.now() - latest.createdAt;
    if (age >= PRE_FUNDING_VERIFY_ERROR_RELEASE_MIN_AGE_MS) {
      await ctx.runMutation(internalAny.payments.mutations.releaseStuckPreFundingPaymentInternal, {
        paymentId: latest._id,
        reason:
          "Could not verify payment with Flutterwave; previous attempt cleared so you can try again.",
      });
      return (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
        projectId,
      })) as PaymentSummary;
    }
    return latest;
  }

  const st = (verification.data.status ?? "").toLowerCase();
  if (st === "successful" || st === "succeeded") {
    await ctx.runMutation(internalAny.payments.mutations.handlePaymentSuccess, {
      transactionId: txRef,
      eventId: String(verification.data.id ?? txRef),
      data: verification.data,
    });
    return (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
      projectId,
    })) as PaymentSummary;
  }

  if (st === "pending") {
    const age = Date.now() - latest.createdAt;
    if (age >= PRE_FUNDING_IN_FLIGHT_MAX_MS) {
      await ctx.runMutation(internalAny.payments.mutations.releaseStuckPreFundingPaymentInternal, {
        paymentId: latest._id,
        reason: "Checkout timed out. You can start a new payment.",
      });
      return (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
        projectId,
      })) as PaymentSummary;
    }
    return latest;
  }

  if (
    st === "cancelled" ||
    st === "canceled" ||
    st === "abandoned" ||
    st === "closed"
  ) {
    await ctx.runMutation(internalAny.payments.mutations.releaseStuckPreFundingPaymentInternal, {
      paymentId: latest._id,
      reason: `Checkout was not completed (Flutterwave status: ${verification.data.status}).`,
      terminalStatus: "cancelled",
    });
    return (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
      projectId,
    })) as PaymentSummary;
  }

  await ctx.runMutation(internalAny.payments.mutations.handlePaymentFailure, {
    transactionId: txRef,
    eventId: String(verification.data.id ?? "create-payment-intent-verify"),
    errorMessage:
      verification.data.processor_response || `Payment status: ${verification.data.status}`,
  });
  return (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
    projectId,
  })) as PaymentSummary;
}

/**
 * Initialize a Flutterwave payment for project pre-funding
 * Returns payment link that user will be redirected to
 */
export const createPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(), // Amount in currency unit (e.g., dollars, not cents)
    currency: v.string(), // e.g., "NGN", "USD", "KES"
    userId: v.id("users"),
    /** Apply up to this many cents from the client's in-platform wallet toward this hire. */
    walletCreditCentsToApply: v.optional(v.number()),
    /** @deprecated Use walletCreditCentsToApply */
    referralCreditCentsToApply: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    paymentLink: string | null;
    paymentId: string;
    txRef: string;
    fundedWithWalletOnly?: boolean;
  }> => {
    // Verify user and project
    const user = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
      userId: args.userId,
    });

    if (!user || user.role !== "client") {
      throw new Error("Only clients can create payments");
    }

    const project = await ctx.runQuery(internalAny.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.clientId !== user._id) {
      throw new Error("Not authorized to pay for this project");
    }

    if (project.status !== "draft" && project.status !== "pending_funding") {
      throw new Error("Project is not in a state that allows payment");
    }

    let latestPreFunding = (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
      projectId: args.projectId,
    })) as PaymentSummary;

    if (latestPreFunding?.status === "succeeded") {
      throw new Error("Project is already funded");
    }

    latestPreFunding = await refreshLatestPreFundingAgainstFlutterwave(ctx, args.projectId);

    if (latestPreFunding?.status === "succeeded") {
      throw new Error("Project is already funded");
    }

    if (
      latestPreFunding?.flutterwaveTransactionId &&
      (latestPreFunding.status === "pending" || latestPreFunding.status === "processing")
    ) {
      const paymentAge = Date.now() - latestPreFunding.createdAt;
      if (paymentAge < PRE_FUNDING_IN_FLIGHT_MAX_MS) {
        throw new Error(
          "A payment is already being processed for this project. Complete or cancel it on the payment page, or wait a few minutes and try again."
        );
      }
      await ctx.runMutation(internalAny.payments.mutations.releaseStuckPreFundingPaymentInternal, {
        paymentId: latestPreFunding._id,
        reason: "Previous checkout expired. Starting a new payment session.",
      });
    }

    if (latestPreFunding?.status === "pending" && !latestPreFunding.flutterwaveTransactionId) {
      throw new Error("A payment is already being processed for this project. Please wait or contact support.");
    }

    assertUsdCurrency(args.currency, "createPaymentIntent");
    assertUsdCurrency(project.currency || "usd", "createPaymentIntent project");
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Invalid payment amount");
    }
    if (Math.abs(args.amount - project.totalAmount) > 0.01) {
      throw new Error("Payment amount must match the hire total");
    }

    const fundingGrossAmount = project.totalAmount;
    const currencyLower = args.currency.toLowerCase();
    const spendableCents = await ctx.runQuery(
      internalAny.wallets.queries.getClientSpendableWalletCentsInternal,
      { userId: args.userId, currency: args.currency }
    );

    const grossCents = Math.round(fundingGrossAmount * 100);
    const fromUi =
      args.walletCreditCentsToApply ?? args.referralCreditCentsToApply ?? spendableCents;
    const requestedApply = Math.max(0, Math.floor(fromUi));
    let applyCents = Math.min(requestedApply, spendableCents, grossCents);

    const MIN_FW_CENTS = 1;
    let fwCents = grossCents - applyCents;
    if (fwCents > 0 && fwCents < MIN_FW_CENTS) {
      applyCents = Math.max(0, grossCents - MIN_FW_CENTS);
      applyCents = Math.min(applyCents, spendableCents);
      fwCents = grossCents - applyCents;
    }
    if (fwCents < 0) {
      throw new Error("Invalid payment amount after wallet credit");
    }
    if (fwCents > 0 && fwCents < MIN_FW_CENTS) {
      throw new Error("Amount too small to charge after applying wallet credit");
    }

    if (fwCents === 0) {
      const out = await ctx.runMutation(
        internalAny.payments.mutations.completePreFundingWithWalletOnlyInternal,
        {
          projectId: args.projectId,
          userId: args.userId,
          fundingGrossAmount,
          currency: args.currency,
          walletCreditCents: applyCents,
        }
      );
      return {
        paymentLink: null,
        paymentId: out.paymentId,
        txRef: out.txRef,
        fundedWithWalletOnly: true,
      };
    }

    const txRef = `49gig-${args.projectId}-${Date.now()}`;

    const baseUrl = resolveFrontendBaseUrl();
    const redirectUrl = `${baseUrl}/dashboard/projects/${args.projectId}/payment/callback`;

    const flutterwaveAmount = Number((fwCents / 100).toFixed(2));
    const clientWalletCreditApplied = applyCents / 100;

    const paymentData = await flutterwave.initializePayment({
      tx_ref: txRef,
      amount: flutterwaveAmount,
      currency: args.currency.toUpperCase(),
      redirect_url: redirectUrl,
      customer: buildFlutterwaveCustomer(user),
      customizations: {
        title: "49GIG Project Funding",
        description: `Project: ${project.intakeForm.title}`.slice(0, 100),
      },
      meta: flutterwaveStringMeta({
        projectId: args.projectId,
        userId: args.userId,
        type: "pre_funding",
      }),
    });

    // Create payment record in database
    const platformFeePercent = project.platformFee ?? await ctx.runQuery(
      internalAny.platformSettings.queries.getPlatformFeePercentageInternal,
      {}
    );
    const platformFeeAmountUsd = (fundingGrossAmount * platformFeePercent) / 100;
    const netAmount = fundingGrossAmount - platformFeeAmountUsd;

    const paymentId = await ctx.runMutation(
      internalAny.payments.mutations.createPayment,
      {
        projectId: args.projectId,
        type: "pre_funding",
        amount: flutterwaveAmount,
        currency: currencyLower,
        platformFee: platformFeeAmountUsd,
        netAmount: netAmount,
        fundingGrossAmount,
        clientWalletCreditApplied:
          clientWalletCreditApplied > 0 ? clientWalletCreditApplied : undefined,
        flutterwaveTransactionId: txRef, // Store tx_ref as transaction ID
        flutterwaveCustomerEmail: user.email,
        userId: args.userId,
        status: "pending",
      }
    );

    // Update project status to pending_funding only if still in draft
    const currentProject = await ctx.runQuery(internalAny.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });
    
    if (currentProject && currentProject.status === "draft") {
      await ctx.runMutation(internalAny.projects.mutations.updateProjectStatusInternal, {
        projectId: args.projectId,
        status: "pending_funding",
      });
    }

    return {
      paymentLink: paymentData.data.link,
      paymentId,
      txRef,
    };
  },
});

/**
 * Create a Flutterwave payment for adding funds (top-up) to an in-progress or cancelled project.
 * Fee is taken from client payment before escrow (same as initial funding). Supports all Flutterwave currencies.
 */
export const createTopUpPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    monthsToFund: v.number(), // Number of months to pay for (must be >= 1)
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ paymentLink: string; paymentId: string; txRef: string }> => {
    const user = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "client") {
      throw new Error("Only clients can add payment for a project");
    }

    const project = await ctx.runQuery(internalAny.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.clientId !== user._id) {
      throw new Error("Not authorized to pay for this project");
    }
    if (project.status !== "in_progress" && project.status !== "cancelled") {
      throw new Error("Add payment is only available for active hires or ended hires you can reactivate");
    }
    assertUsdCurrency(project.currency || "usd", "createTopUpPaymentIntent");

    const monthsToFund = Math.max(1, Math.floor(args.monthsToFund));
    const raw = project.intakeForm?.projectDuration;
    const durationMonths =
      !raw ? 3
      : raw === "12+" ? 12
      : Math.max(1, parseInt(raw, 10) || 1);
    const perMonth = project.totalAmount / durationMonths;
    const amount = perMonth * monthsToFund;
    if (amount <= 0 || !Number.isFinite(amount)) {
      throw new Error("Invalid amount for selected months");
    }

    const amountRounded = Number(amount.toFixed(2));
    const currency = (project.currency || "USD").toUpperCase();
    const baseUrl = resolveFrontendBaseUrl();
    const redirectUrl = `${baseUrl}/dashboard/projects/${args.projectId}/payment/callback?type=top_up`;
    const txRef = `49gig-topup-${args.projectId}-${Date.now()}`;

    const paymentData = await flutterwave.initializePayment({
      tx_ref: txRef,
      amount: amountRounded,
      currency,
      redirect_url: redirectUrl,
      customer: buildFlutterwaveCustomer(user),
      customizations: {
        title: "49GIG Add Payment",
        description: `Add ${monthsToFund} month(s) for: ${project.intakeForm?.title ?? "Hire"}`.slice(0, 100),
      },
      meta: flutterwaveStringMeta({
        projectId: args.projectId,
        userId: args.userId,
        type: "top_up",
        monthsToFund,
      }),
    });

    const platformFeePercent =
      project.platformFee ??
      (await ctx.runQuery(internalAny.platformSettings.queries.getPlatformFeePercentageInternal, {}));
    const platformFeeAmountUsd = (amountRounded * platformFeePercent) / 100;
    const netAmount = amountRounded - platformFeeAmountUsd;

    const paymentId = await ctx.runMutation(internalAny.payments.mutations.createPayment, {
      projectId: args.projectId,
      type: "top_up",
      topUpMonths: monthsToFund,
      amount: amountRounded,
      currency: project.currency || "usd",
      platformFee: platformFeeAmountUsd,
      netAmount,
      flutterwaveTransactionId: txRef,
      flutterwaveCustomerEmail: user.email,
      userId: args.userId,
      status: "pending",
    });

    return {
      paymentLink: paymentData.data.link,
      paymentId,
      txRef,
    };
  },
});

/**
 * Mark a pending Flutterwave checkout as cancelled when the user leaves or cancels pay,
 * so `createPaymentIntent` / top-up are not blocked by a stale `pending` row.
 * Prefer passing `txRef` from the redirect query string when available.
 */
export const abandonCheckoutPayment = action({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    txRef: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ released: boolean }> => {
    // Best-effort cleanup: if the project is missing or the caller isn't
    // authorized to see it (e.g. admin force-deleted, or a stale callback
    // fired after navigation), no-op instead of throwing — there's nothing
    // legitimate to release.
    const project = await ctx.runQuery(internalAny.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });
    if (!project) {
      return { released: false };
    }

    let payment: PaymentSummary = null;
    if (args.txRef) {
      const byTx = (await ctx.runQuery(internalAny.payments.queries.getPaymentByTransactionId, {
        transactionId: args.txRef,
      })) as PaymentSummary;
      if (byTx && byTx.projectId === args.projectId) {
        payment = byTx;
      }
    } else {
      payment = (await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
        projectId: args.projectId,
      })) as PaymentSummary;
    }

    if (!payment) {
      return { released: false };
    }
    if (payment.type !== "pre_funding" && payment.type !== "top_up") {
      return { released: false };
    }
    if (payment.status !== "pending" && payment.status !== "processing") {
      return { released: false };
    }
    if (args.txRef && payment.flutterwaveTransactionId !== args.txRef) {
      return { released: false };
    }

    await ctx.runMutation(internalAny.payments.mutations.releaseStuckPreFundingPaymentInternal, {
      paymentId: payment._id,
      reason: "Checkout was cancelled or abandoned before completion.",
      terminalStatus: "cancelled",
    });
    return { released: true };
  },
});

/**
 * Verify a Flutterwave payment transaction
 * Called after user returns from Flutterwave payment page
 */
export const verifyPayment = action({
  args: {
    txRef: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify payment with Flutterwave
    const verification = await flutterwave.verifyPayment(args.txRef);

    // Flutterwave verify API returns "successful"; some flows use "succeeded"
    const isSuccess =
      verification.data.status === "successful" || verification.data.status === "succeeded";
    if (!isSuccess) {
      await ctx.runMutation(internalAny.payments.mutations.handlePaymentFailure, {
        transactionId: args.txRef,
        eventId: verification.data.id?.toString() ?? "verify-callback-failed",
        errorMessage:
          verification.data.processor_response ||
          `Payment verification failed: ${verification.data.status}`,
      });
      throw new Error(
        verification.data.processor_response ||
          `Payment was not successful (${verification.data.status}). You can try again.`
      );
    }

    // Find payment record
    const payment = await ctx.runQuery(
      internalAny.payments.queries.getPaymentByTransactionId,
      {
        transactionId: args.txRef,
      }
    );

    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Update payment status (pre-funding pipeline schedules match generation + acceptance)
    await ctx.runMutation(internalAny.payments.mutations.handlePaymentSuccess, {
      transactionId: args.txRef,
      eventId: verification.data.id.toString(),
      data: verification.data,
    });

    return { success: true, status: verification.data.status };
  },
});

/**
 * Handle Flutterwave webhook events
 * This is called by Flutterwave when payment events occur
 */
export const handleFlutterwaveWebhook = action({
  args: {
    event: v.string(), // Event type: charge.completed, transfer.completed, etc.
    data: v.any(), // Event data
  },
  handler: async (ctx, args) => {
    try {
      // Flutterwave webhook events:
      // - charge.completed: Payment completed
      // - transfer.completed: Transfer completed
      // - transfer.reversed: Transfer reversed
      // - refund.completed: Refund completed

      console.log(`Processing Flutterwave webhook event: ${args.event}`, {
        hasData: !!args.data,
        txRef: args.data?.tx_ref,
        status: args.data?.status,
      });

      // Webhook dedup: short-circuit if we've already processed this event id.
      // Flutterwave does not guarantee the same envelope field for event id, so
      // prefer `id`, fall back to `tx_ref`/`reference` for charge events.
      const rawEventId =
        (args.data && typeof args.data === "object"
          ? (args.data.id ?? args.data.tx_ref ?? args.data.reference)
          : undefined);
      const webhookEventId =
        rawEventId != null && rawEventId !== ""
          ? String(rawEventId)
          : "";
      if (webhookEventId) {
        const isNew: boolean = await ctx.runMutation(
          internalAny.payments.mutations.recordWebhookEventIfNew,
          {
            provider: "flutterwave",
            eventId: webhookEventId,
            eventType: args.event,
          }
        );
        if (!isNew) {
          console.log(
            `Flutterwave webhook: duplicate event ${args.event} (${webhookEventId}), skipping.`
          );
          return { processed: true, event: args.event, duplicate: true };
        }
      }

      switch (args.event) {
      case "charge.completed": {
        // Flutterwave may send tx_ref or reference; reference can be our tx_ref (49gig-*)
        const txRef =
          args.data?.tx_ref ||
          (typeof args.data?.reference === "string" && args.data.reference.startsWith("49gig-")
            ? args.data.reference
            : null);

        if (txRef) {
          // Find payment by transaction reference
          const payment = await ctx.runQuery(
            internalAny.payments.queries.getPaymentByTransactionId,
            {
              transactionId: txRef,
            }
          );

          if (payment) {
            // Flutterwave webhook uses "succeeded"; verify API uses "successful" - accept both
            const isSuccess =
              args.data?.status === "successful" || args.data?.status === "succeeded";

            if (isSuccess) {
              await ctx.runMutation(internalAny.payments.mutations.handlePaymentSuccess, {
                transactionId: txRef,
                eventId: args.data.id?.toString() || txRef,
                data: args.data,
              });
            } else {
              await ctx.runMutation(internalAny.payments.mutations.handlePaymentFailure, {
                transactionId: txRef,
                eventId: args.data.id?.toString() || txRef,
                errorMessage: args.data.processor_response || "Payment failed",
              });
            }
          } else {
            console.warn(`Payment not found for tx_ref: ${txRef}`, {
              event: args.event,
              dataKeys: args.data ? Object.keys(args.data) : [],
            });
          }
        } else {
          console.warn("charge.completed webhook missing tx_ref/reference", {
            tx_ref: args.data?.tx_ref,
            reference: args.data?.reference,
          });
        }
        break;
      }

      case "transfer.completed":
        if (args.data.reference) {
          await ctx.runMutation(internalAny.payments.mutations.updatePaymentByTransferId, {
            transferId: args.data.reference,
            status: "succeeded",
          });
        }
        break;

      case "transfer.reversed":
        if (args.data.reference) {
          await ctx.runMutation(internalAny.payments.mutations.updatePaymentByTransferId, {
            transferId: args.data.reference,
            status: "failed",
            errorMessage: "Transfer reversed",
          });
        }
        break;

      default:
        console.log(`Unhandled Flutterwave webhook event: ${args.event}`, {
          eventData: args.data,
        });
    }

    return { processed: true, event: args.event };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error handling Flutterwave webhook (${args.event}):`, errorMessage, error);
      // Re-throw to let the webhook route handle it
      throw new Error(`Webhook processing failed: ${errorMessage}`);
    }
  },
});

/**
 * Refund a payment (full or partial) for dispute resolution
 */
export const refundPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(), // Amount in currency unit
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: true; refundId: string }> => {
    // Idempotency: if we already issued a refund for this project, return it.
    // Dispute-driven refunds are one-shot by design, so this gate protects
    // against double-clicks, webhook replays into the resolve flow, and any
    // caller retrying after a transient error.
    const existingRefund = await ctx.runQuery(
      internalAny.payments.queries.getExistingRefundForProject,
      { projectId: args.projectId }
    );
    if (existingRefund) {
      const refundId =
        existingRefund.flutterwaveRefundId ?? String(existingRefund._id);
      return { success: true, refundId };
    }

    const payment = await ctx.runQuery(internalAny.payments.queries.getPaymentByProject, {
      projectId: args.projectId,
    });

    if (!payment || !payment.flutterwaveTransactionId) {
      throw new Error("No payment transaction found for this project");
    }

    // Flutterwave requires transaction ID (numeric) for refunds
    // We need to get the actual transaction ID from Flutterwave using tx_ref
    // For now, we'll need to verify the payment to get the transaction ID
    // In production, store both tx_ref and transaction ID
    const verification = await flutterwave.verifyPayment(payment.flutterwaveTransactionId);

    if (!verification.data.id) {
      throw new Error("Unable to retrieve transaction ID for refund");
    }

    const grossPaid =
      payment.fundingGrossAmount ??
      (payment.amount + Math.max(0, payment.platformFee ?? 0));
    const refundAmount = Math.min(Math.max(0, args.amount), grossPaid);
    if (refundAmount <= 0) {
      throw new Error("Refund amount must be greater than zero");
    }
    const refundData = await flutterwave.createRefund(
      verification.data.id.toString(),
      refundAmount,
      args.reason || "Customer refund request"
    );

    // One more dedup pass: if another invocation won the race while we were
    // waiting on Flutterwave, don't double-record / double-credit the wallet.
    const dupAfterCall = await ctx.runQuery(
      internalAny.payments.queries.getPaymentByRefundId,
      { refundId: refundData.data.id.toString() }
    );
    if (dupAfterCall) {
      return { success: true, refundId: refundData.data.id.toString() };
    }

    // Get project to find clientId for the refund payment record
    const project = await ctx.runQuery(internalAny.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.projectId as unknown as Id<"users">,
    });
    const clientId: Id<"users"> | undefined = project?.clientId;

    if (!clientId) {
      throw new Error("Unable to determine client ID for refund");
    }

    await ctx.runMutation(internalAny.payments.mutations.createPayment, {
      projectId: args.projectId,
      type: "refund",
      amount: refundAmount,
      currency: payment.currency,
      platformFee: 0,
      netAmount: refundAmount,
      flutterwaveTransactionId: payment.flutterwaveTransactionId,
      flutterwaveRefundId: refundData.data.id.toString(),
      flutterwaveCustomerEmail: payment.flutterwaveCustomerEmail,
      userId: clientId,
      status: "refunded",
    });

    await ctx.runMutation(internalAny.wallets.mutations.creditWallet, {
      userId: clientId,
      amountCents: Math.round(refundAmount * 100),
      currency: payment.currency,
      description: `Refund credited for project ${args.projectId}`,
      projectId: args.projectId,
    });

    return { success: true, refundId: refundData.data.id.toString() };
  },
});

/**
 * Create a Flutterwave transfer/payout to a freelancer
 */
export const createPayoutTransfer = action({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    amount: v.number(), // Amount in currency unit
    currency: v.string(),
    bankCode: v.string(), // Flutterwave bank code
    accountNumber: v.string(),
    accountName: v.string(),
  },
  handler: async (ctx, args) => {
    const freelancer = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
      userId: args.freelancerId,
    });
    
    if (!freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerDoc = freelancer as typeof freelancer & {
      flutterwaveSubaccountId?: string;
    };

    // Generate unique transfer reference
    const transferRef = `49gig-payout-${args.projectId}-${Date.now()}`;

    // Create transfer to freelancer
    // If freelancer has subaccount, use that; otherwise transfer to bank
    const transferData = await flutterwave.createTransfer({
      account_bank: args.bankCode,
      account_number: args.accountNumber,
      amount: args.amount,
      narration: `49GIG payout for project ${args.projectId}`,
      currency: args.currency.toUpperCase(),
      reference: transferRef,
      beneficiary_name: args.accountName,
      ...(freelancerDoc.flutterwaveSubaccountId && {
        subaccount: freelancerDoc.flutterwaveSubaccountId,
      }),
    });

    await ctx.runMutation(internalAny.payments.mutations.createPayment, {
      projectId: args.projectId,
      type: "payout",
      amount: args.amount,
      currency: args.currency,
      platformFee: 0,
      netAmount: args.amount,
      flutterwaveTransferId: transferRef,
      flutterwaveSubaccountId: freelancerDoc.flutterwaveSubaccountId,
      userId: args.freelancerId,
      status: transferData.data.status === "NEW" ? "processing" : "succeeded",
    });

    return { success: true, transferId: transferRef };
  },
});

/**
 * Create a Flutterwave subaccount for a freelancer
 * Equivalent to Stripe Connect account creation
 */
export const createSubaccount = action({
  args: {
    freelancerId: v.id("users"),
    /** Email/password sessions omit Convex Auth identity; pass the logged-in user id from the client. */
    viewerUserId: v.optional(v.id("users")),
    accountNumber: v.string(),
    accountBank: v.string(),
    country: v.string(),
    splitType: v.union(v.literal("percentage"), v.literal("flat")),
    splitValue: v.number(),
  },
  returns: v.object({
    success: v.literal(true),
    subaccountId: v.string(),
    accountReference: v.string(),
    bankName: v.string(),
  }),
  handler: async (ctx, args) => {
    let viewer:
      | {
          _id: Id<"users">;
          email: string;
          role: string;
          status: string;
        }
      | null
      | undefined = null;

    if (args.viewerUserId) {
      viewer = await ctx.runQuery(internalAny.auth.actionQueries.getActiveUserByIdInternal, {
        userId: args.viewerUserId,
      });
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) {
        throw new Error("Not authenticated");
      }
      viewer = await ctx.runQuery(internalAny.auth.actionQueries.getActiveUserByEmailInternal, {
        email: identity.email,
      });
    }

    if (!viewer || viewer.status !== "active") {
      throw new Error("Not authenticated");
    }
    const isPrivilegedAdmin = viewer.role === "admin";
    if (
      !isPrivilegedAdmin &&
      (viewer.role !== "freelancer" || viewer._id !== args.freelancerId)
    ) {
      throw new Error("Not authorized");
    }

    const freelancer = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
      userId: args.freelancerId,
    });

    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Only freelancers can create subaccounts");
    }

    const phoneDigits = freelancer.phoneE164?.replace(/\D/g, "").trim() ?? "";
    if (!phoneDigits || phoneDigits.length < 8) {
      throw new Error(
        "Verify your phone number (SMS verification) in Settings before adding a payout account."
      );
    }

    const businessName = freelancer.name.trim();
    const businessEmail = freelancer.email.trim().toLowerCase();
    const businessMobile = phoneDigits;
    if (!businessName || !businessEmail) {
      throw new Error("Your profile name and email must be set before adding a payout account.");
    }

    // Verify account number before creating subaccount
    try {
      const accountVerification = await flutterwave.verifyAccountNumber({
        account_number: args.accountNumber,
        account_bank: args.accountBank,
      });

      if (!accountVerification.data || !accountVerification.data.account_name) {
        throw new Error("Unable to verify account number. Please check your account number and bank selection.");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("couldn't verify") || error.message.includes("verify")) {
          throw new Error("Invalid account number. Please ensure the account number matches the selected bank.");
        }
        throw error;
      }
      throw new Error("Account verification failed. Please check your account details and try again.");
    }

    const subaccountData = await flutterwave.createSubaccount({
      business_name: businessName,
      business_email: businessEmail,
      business_mobile: businessMobile,
      account_number: args.accountNumber,
      account_bank: args.accountBank,
      country: args.country,
      split_type: args.splitType,
      split_value: args.splitValue,
    });

    await ctx.runMutation(internalAny.payments.mutations.updateUserFlutterwaveSubaccountId, {
      userId: args.freelancerId,
      flutterwaveSubaccountId: subaccountData.data.id.toString(),
      bankCode: args.accountBank,
      accountNumber: args.accountNumber,
    });

    return {
      success: true as const,
      subaccountId: subaccountData.data.id.toString(),
      accountReference: subaccountData.data.account_reference,
      bankName: subaccountData.data.bank_name,
    };
  },
});

/**
 * Get Flutterwave subaccount details for a freelancer
 */
export const getSubaccountStatus = action({
  args: {
    freelancerId: v.id("users"),
    viewerUserId: v.optional(v.id("users")),
  },
  returns: v.union(
    v.object({
      connected: v.literal(false),
      error: v.optional(v.string()),
    }),
    v.object({
      connected: v.literal(true),
      subaccountId: v.string(),
      accountName: v.optional(v.string()),
      accountReference: v.string(),
      bankName: v.optional(v.string()),
      bankCode: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    let viewer:
      | {
          _id: Id<"users">;
          role: string;
          status: string;
        }
      | null
      | undefined = null;

    if (args.viewerUserId) {
      viewer = await ctx.runQuery(internalAny.auth.actionQueries.getActiveUserByIdInternal, {
        userId: args.viewerUserId,
      });
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) {
        throw new Error("Not authenticated");
      }
      viewer = await ctx.runQuery(internalAny.auth.actionQueries.getActiveUserByEmailInternal, {
        email: identity.email,
      });
    }

    if (!viewer || viewer.status !== "active") {
      throw new Error("Not authenticated");
    }
    if (viewer.role !== "admin" && viewer._id !== args.freelancerId) {
      throw new Error("Not authorized");
    }

    const freelancer = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
      userId: args.freelancerId,
    });

    if (!freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerDoc = freelancer as typeof freelancer & {
      flutterwaveSubaccountId?: string;
    };

    if (!freelancerDoc.flutterwaveSubaccountId) {
      return { connected: false as const };
    }

    try {
      const subaccountData = await flutterwave.getSubaccount(freelancerDoc.flutterwaveSubaccountId);
      const data = subaccountData.data;
      return {
        connected: true as const,
        subaccountId: data.id.toString(),
        accountName: data.account_name,
        accountReference: data.account_reference,
        bankName: data.bank_name,
        bankCode: data.account_bank ?? data.bank_code,
      };
    } catch (error) {
      console.error("Failed to get subaccount status:", error);
      return { connected: false as const, error: "Failed to fetch subaccount details" };
    }
  },
});

/**
 * Get list of banks for a country (for subaccount creation)
 */
export const getBanks = action({
  args: {
    country: v.string(), // Country code like "NG", "KE", etc.
  },
  handler: async (ctx, args) => {
    const banksData = await flutterwave.getBanks(args.country);
    return {
      banks: banksData.data.map((bank) => ({
        code: bank.code,
        name: bank.name,
      })),
    };
  },
});

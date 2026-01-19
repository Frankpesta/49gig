
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import * as flutterwave from "./flutterwave";

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
  },
  handler: async (ctx, args): Promise<{ paymentLink: string; paymentId: string; txRef: string }> => {
    // Verify user and project
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });

    if (!user || user.role !== "client") {
      throw new Error("Only clients can create payments");
    }

    const project = await ctx.runQuery(internal.payments.queries.getProject, {
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

    // Check if payment already exists
    const existingPayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      {
        projectId: args.projectId,
      }
    );

    if (existingPayment) {
      if (existingPayment.status === "succeeded") {
        throw new Error("Project is already funded");
      }
      
      // If there's a pending payment with a transaction reference, return its payment link
      if (existingPayment.flutterwaveTransactionId && 
          (existingPayment.status === "pending" || existingPayment.status === "processing")) {
        // For Flutterwave, we'd need to reconstruct the payment link or retrieve it
        // Since we store tx_ref, we can regenerate the link or return existing
        // For now, we'll create a new payment if the old one is stale
        const now = Date.now();
        const paymentAge = now - existingPayment.createdAt;
        // If payment is less than 1 hour old, don't create duplicate
        if (paymentAge < 60 * 60 * 1000) {
          throw new Error("A payment is already being processed for this project. Please wait or contact support.");
        }
      }
      
      if (existingPayment.status === "pending" && !existingPayment.flutterwaveTransactionId) {
        throw new Error("A payment is already being processed for this project. Please wait or contact support.");
      }
    }

    // Generate unique transaction reference
    const txRef = `49gig-${args.projectId}-${Date.now()}`;

    // Get redirect URL - use FRONTEND_URL or NEXT_PUBLIC_BASE_URL, fallback to a sensible default
    // CONVEX_SITE_URL points to Convex hosting, not the frontend app
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://your-site.com";
    const redirectUrl = `${baseUrl}/dashboard/projects/${args.projectId}/payment/callback`;

    // Initialize Flutterwave payment
    const paymentData = await flutterwave.initializePayment({
      tx_ref: txRef,
      amount: args.amount,
      currency: args.currency.toUpperCase(),
      redirect_url: redirectUrl,
      customer: {
        email: user.email,
        name: user.name,
      },
      customizations: {
        title: "49GIG Project Funding",
        description: `Project: ${project.intakeForm.title}`,
      },
      meta: {
        projectId: args.projectId,
        userId: args.userId,
        type: "pre_funding",
      },
    });

    // Create payment record in database
    const platformFee = project.platformFee || 10; // Default 10%
    const platformFeeAmount = (args.amount * platformFee) / 100;
    const netAmount = args.amount - platformFeeAmount;

    const paymentId = await ctx.runMutation(
      internal.payments.mutations.createPayment,
      {
        projectId: args.projectId,
        type: "pre_funding",
        amount: args.amount,
        currency: args.currency,
        platformFee: platformFeeAmount,
        netAmount: netAmount,
        flutterwaveTransactionId: txRef, // Store tx_ref as transaction ID
        flutterwaveCustomerEmail: user.email,
        userId: args.userId,
        status: "pending",
      }
    );

    // Update project status to pending_funding only if still in draft
    const currentProject = await ctx.runQuery(internal.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });
    
    if (currentProject && currentProject.status === "draft") {
      await ctx.runMutation(internal.projects.mutations.updateProjectStatusInternal, {
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

    if (verification.data.status !== "successful") {
      throw new Error(`Payment verification failed: ${verification.data.status}`);
    }

    // Find payment record
    const payment = await ctx.runQuery(
      internal.payments.queries.getPaymentByTransactionId,
      {
        transactionId: args.txRef,
      }
    );

    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Update payment status
    await ctx.runMutation(internal.payments.mutations.handlePaymentSuccess, {
      transactionId: args.txRef,
      eventId: verification.data.id.toString(),
      data: verification.data,
              });

              // Trigger matching if this is a pre-funding payment
    if (payment.type === "pre_funding") {
      try {
        await ctx.runAction(api.matching.actions.generateMatches, {
          projectId: payment.projectId,
          limit: 5,
        });
      } catch (error) {
        console.error("Failed to trigger matching:", error);
      }
    }

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

      switch (args.event) {
      case "charge.completed":
        if (args.data.tx_ref) {
          const txRef = args.data.tx_ref;
          
          // Find payment by transaction reference
          const payment = await ctx.runQuery(
            internal.payments.queries.getPaymentByTransactionId,
            {
              transactionId: txRef,
            }
          );

          if (payment) {
            if (args.data.status === "successful") {
              await ctx.runMutation(internal.payments.mutations.handlePaymentSuccess, {
                transactionId: txRef,
                eventId: args.data.id?.toString() || txRef,
                data: args.data,
              });

              // Trigger matching if this is a pre-funding payment
    if (payment.type === "pre_funding") {
      try {
        await ctx.runAction(api.matching.actions.generateMatches, {
          projectId: payment.projectId,
          limit: 5,
        });
                } catch (error) {
                  console.error("Failed to trigger matching:", error);
                }
              }
            } else {
              await ctx.runMutation(internal.payments.mutations.handlePaymentFailure, {
                transactionId: txRef,
                eventId: args.data.id?.toString() || txRef,
                errorMessage: args.data.processor_response || "Payment failed",
              });
            }
          }
        }
        break;

      case "transfer.completed":
        if (args.data.reference) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByTransferId, {
            transferId: args.data.reference,
            status: "succeeded",
          });
        }
        break;

      case "transfer.reversed":
        if (args.data.reference) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByTransferId, {
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
    const payment = await ctx.runQuery(internal.payments.queries.getPaymentByProject, {
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

    const refundAmount = args.amount < payment.amount ? args.amount : payment.amount;
    const refundData = await flutterwave.createRefund(
      verification.data.id.toString(),
      refundAmount,
      args.reason || "Customer refund request"
    );

    // Get project to find clientId for the refund payment record
    const project = await ctx.runQuery(internal.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.projectId as unknown as Id<"users">,
    });
    const clientId: Id<"users"> | undefined = project?.clientId;

    if (!clientId) {
      throw new Error("Unable to determine client ID for refund");
    }

    await ctx.runMutation(internal.payments.mutations.createPayment, {
      projectId: args.projectId,
      type: "refund",
      amount: args.amount,
      currency: payment.currency,
      platformFee: 0,
      netAmount: args.amount,
      flutterwaveTransactionId: payment.flutterwaveTransactionId,
      flutterwaveRefundId: refundData.data.id.toString(),
      flutterwaveCustomerEmail: payment.flutterwaveCustomerEmail,
      userId: clientId,
      status: "refunded",
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
    milestoneId: v.optional(v.id("milestones")),
    bankCode: v.string(), // Flutterwave bank code
    accountNumber: v.string(),
    accountName: v.string(),
  },
  handler: async (ctx, args) => {
    const freelancer = await ctx.runQuery(internal.payments.queries.verifyUser, {
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
      narration: `Milestone payout for project ${args.projectId}`,
      currency: args.currency.toUpperCase(),
      reference: transferRef,
      beneficiary_name: args.accountName,
      ...(freelancerDoc.flutterwaveSubaccountId && {
        subaccount: freelancerDoc.flutterwaveSubaccountId,
      }),
    });

    await ctx.runMutation(internal.payments.mutations.createPayment, {
      projectId: args.projectId,
      milestoneId: args.milestoneId,
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
    businessName: v.string(), // Business name
    businessEmail: v.string(),
    businessMobile: v.string(),
    accountNumber: v.string(), // Bank account number
    accountBank: v.string(), // Bank code
    country: v.string(), // Country code like "NG", "KE", etc.
    splitType: v.union(v.literal("percentage"), v.literal("flat")),
    splitValue: v.number(), // Percentage or flat amount
  },
  handler: async (ctx, args) => {
    // Verify freelancer
    const freelancer = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.freelancerId,
    });

    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Only freelancers can create subaccounts");
    }

    // Verify account number before creating subaccount
    // This ensures the account number is valid and belongs to the specified bank
    try {
      const accountVerification = await flutterwave.verifyAccountNumber({
        account_number: args.accountNumber,
        account_bank: args.accountBank,
      });

      if (!accountVerification.data || !accountVerification.data.account_name) {
        throw new Error("Unable to verify account number. Please check your account number and bank selection.");
      }
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        if (error.message.includes("couldn't verify") || error.message.includes("verify")) {
          throw new Error("Invalid account number. Please ensure the account number matches the selected bank.");
        }
        throw error;
      }
      throw new Error("Account verification failed. Please check your account details and try again.");
    }

    const subaccountData = await flutterwave.createSubaccount({
      business_name: args.businessName,
      business_email: args.businessEmail,
      business_mobile: args.businessMobile,
      account_number: args.accountNumber,
      account_bank: args.accountBank,
      country: args.country,
      split_type: args.splitType,
      split_value: args.splitValue,
    });

    // Update user with subaccount ID
    await ctx.runMutation(internal.payments.mutations.updateUserFlutterwaveSubaccountId, {
      userId: args.freelancerId,
      flutterwaveSubaccountId: subaccountData.data.id.toString(),
    });

    return {
      success: true,
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
  },
  handler: async (ctx, args) => {
    const freelancer = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.freelancerId,
    });

    if (!freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerDoc = freelancer as typeof freelancer & {
      flutterwaveSubaccountId?: string;
    };

    if (!freelancerDoc.flutterwaveSubaccountId) {
      return { connected: false };
    }

    try {
      const subaccountData = await flutterwave.getSubaccount(freelancerDoc.flutterwaveSubaccountId);
      return {
        connected: true,
        subaccountId: subaccountData.data.id.toString(),
        accountName: subaccountData.data.account_name,
        accountReference: subaccountData.data.account_reference,
        bankName: subaccountData.data.bank_name,
        bankCode: subaccountData.data.bank_code,
      };
    } catch (error) {
      console.error("Failed to get subaccount status:", error);
      return { connected: false, error: "Failed to fetch subaccount details" };
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

/**
 * Release milestone payment manually (client action)
 * Calculates platform fee and creates transfer to freelancer
 */
export const releaseMilestonePayment = action({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    paymentId: string;
    transferId: string;
    amount: number;
    netAmount: number;
    platformFee: number;
  }> => {
    // Verify user
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get milestone
    const milestone = await ctx.runQuery(internal.projects.queries.getMilestoneByIdInternal, {
      milestoneId: args.milestoneId,
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Only approved milestones can be released
    if (milestone.status !== "approved") {
      throw new Error(`Milestone is not approved (status: ${milestone.status})`);
    }

    // Get project
    const project = await ctx.runQuery(internal.payments.queries.getProject, {
      projectId: milestone.projectId,
      userId: args.userId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Only client who owns project or admin can release
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to release this milestone payment");
    }

    // Get freelancer
    if (!project.matchedFreelancerId) {
      throw new Error("Project has no matched freelancer");
    }

    const freelancer = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: project.matchedFreelancerId,
    });

    if (!freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerDoc: typeof freelancer & {
      flutterwaveSubaccountId?: string;
    } = freelancer as typeof freelancer & {
      flutterwaveSubaccountId?: string;
    };

    // Check if freelancer has subaccount
    if (!freelancerDoc.flutterwaveSubaccountId) {
      throw new Error("Freelancer has not set up payout account. Please contact the freelancer to set up their payout details.");
    }

    // Get subaccount details to extract bank info
    let subaccountDetails: {
      status: string;
      message: string;
      data: {
        id: number;
        account_name: string;
        account_reference: string;
        bank_name: string;
        bank_code: string;
        account_number?: string;
      };
    };
    try {
      subaccountDetails = await flutterwave.getSubaccount(freelancerDoc.flutterwaveSubaccountId);
    } catch (error) {
      console.error("Failed to get subaccount details:", error);
      throw new Error("Failed to retrieve freelancer payout account details. Please contact support.");
    }

    // Calculate platform fee
    const platformFee: number = project.platformFee || 10; // Default 10%
    const platformFeeAmount: number = (milestone.amount * platformFee) / 100;
    const netAmount: number = milestone.amount - platformFeeAmount;

    // Generate unique transfer reference
    const transferRef = `49gig-milestone-${args.milestoneId}-${Date.now()}`;

    // Create transfer to freelancer using subaccount
    // Note: Flutterwave requires account_number even with subaccount
    // We need to store account_number when creating subaccount
    let transferData: {
      status: string;
      message: string;
      data: {
        id: number;
        account_number: string;
        bank_code: string;
        full_name: string;
        created_at: string;
        currency: string;
        debit_currency: string;
        amount: number;
        fee: number;
        status: string;
        reference: string;
        meta: Record<string, unknown>;
        narration: string;
        complete_message: string;
        requires_approval: number;
        is_approved: number;
        bank_name: string;
      };
    };
    try {
      transferData = await flutterwave.createTransfer({
        account_bank: subaccountDetails.data.bank_code,
        account_number: subaccountDetails.data.account_number || "0000000000", // Placeholder - should be stored when subaccount is created
        amount: netAmount,
        narration: `Milestone payout: ${milestone.title} - Project: ${project.intakeForm.title}`,
        currency: milestone.currency.toUpperCase(),
        reference: transferRef,
        beneficiary_name: subaccountDetails.data.account_name,
        subaccount: freelancerDoc.flutterwaveSubaccountId,
      });
    } catch (error) {
      console.error("Failed to create transfer:", error);
      throw new Error(`Failed to create transfer: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Create payment record
    const paymentId: string = await ctx.runMutation(internal.payments.mutations.createPayment, {
      projectId: milestone.projectId,
      milestoneId: args.milestoneId,
      type: "milestone_release",
      amount: milestone.amount,
      currency: milestone.currency,
      platformFee: platformFeeAmount,
      netAmount: netAmount,
      flutterwaveTransferId: transferRef,
      flutterwaveSubaccountId: freelancerDoc.flutterwaveSubaccountId,
      userId: project.matchedFreelancerId,
      status: transferData.data.status === "NEW" ? "processing" : "succeeded",
    });

    // Update milestone status
    const now = Date.now();
    await ctx.runMutation(internal.milestones.mutations.updateMilestonePaymentStatus, {
      milestoneId: args.milestoneId,
      status: "paid",
      paidAt: now,
      flutterwaveTransferId: transferRef,
    });

    // Log audit
    await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
      action: "milestone_payment_released_manual",
      actorId: args.userId,
      actorRole: user.role,
      targetId: paymentId,
      details: {
        milestoneId: args.milestoneId,
        projectId: milestone.projectId,
        freelancerId: project.matchedFreelancerId,
        amount: milestone.amount,
        netAmount: netAmount,
        platformFee: platformFeeAmount,
        transferRef,
      },
    });

    // Send notifications
    await ctx.scheduler.runAfter(0, internal.notifications.actions.sendSystemNotification, {
      userIds: [project.matchedFreelancerId],
      title: "Milestone payment released",
      message: `Payment of ${netAmount} ${milestone.currency.toUpperCase()} has been released for milestone: ${milestone.title}`,
      type: "payment",
      data: { milestoneId: args.milestoneId, projectId: milestone.projectId, paymentId },
    });

    return {
      success: true,
      paymentId,
      transferId: transferRef,
      amount: milestone.amount,
      netAmount,
      platformFee: platformFeeAmount,
    };
  },
});

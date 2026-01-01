import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.action((api as any)["payments/actions"].handleStripeWebhook, {
          eventType: event.type,
          eventId: event.id,
          paymentIntentId: paymentIntentSucceeded.id,
          data: paymentIntentSucceeded,
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.action((api as any)["payments/actions"].handleStripeWebhook, {
          eventType: event.type,
          eventId: event.id,
          paymentIntentId: paymentIntentFailed.id,
          data: paymentIntentFailed,
        });
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.action((api as any)["payments/actions"].handleStripeWebhook, {
          eventType: event.type,
          eventId: event.id,
          paymentIntentId: paymentIntentCanceled.id,
          data: paymentIntentCanceled,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", errorMessage);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}


// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;

/**
 * Verify Flutterwave webhook signature
 * Flutterwave uses HMAC SHA512 to sign webhooks
 */
function verifyFlutterwaveSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("verif-hash");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  // Verify webhook signature
  if (!verifyFlutterwaveSignature(body, signature, webhookSecret)) {
    console.error("Flutterwave webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  let event: any;

  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error("Failed to parse webhook body:", err);
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    // Flutterwave webhook event structure:
    // {
    //   "event": "charge.completed",
    //   "data": { ... }
    // }

    const eventType = event.event;
    const eventData = event.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await convex.action((api as any)["payments/actions"].handleFlutterwaveWebhook, {
      event: eventType,
      data: eventData,
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing Flutterwave webhook:", errorMessage);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

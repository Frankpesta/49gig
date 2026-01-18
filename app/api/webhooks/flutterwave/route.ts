// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // Get signature from header - Flutterwave uses "flutterwave-signature" or "verif-hash"
  // Check both headers to support different versions
  const signature = 
    request.headers.get("flutterwave-signature") || 
    request.headers.get("verif-hash");
  
  // If you specified a secret hash, check for the signature
  // Simple string comparison as per Flutterwave docs
  if (!signature || signature !== secretHash) {
    // This request isn't from Flutterwave; discard
    console.error("Flutterwave webhook signature verification failed", {
      hasSignature: !!signature,
      hasSecretHash: !!secretHash,
      headerNames: {
        "flutterwave-signature": request.headers.get("flutterwave-signature"),
        "verif-hash": request.headers.get("verif-hash"),
      },
    });
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let event: any;

  try {
    event = await request.json();
  } catch (err) {
    console.error("Failed to parse webhook body:", err);
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // It's a good idea to log all received events
  console.log("Received Flutterwave webhook:", {
    event: event.event || event.type || "unknown",
    txRef: event.data?.tx_ref || event.tx_ref,
    status: event.data?.status || event.status,
  });

  // Handle the event
  try {
    // Flutterwave webhook event structure can vary:
    // Option 1: { "event": "charge.completed", "data": { ... } }
    // Option 2: { "type": "charge.completed", "data": { ... } }
    // Option 3: Direct data object with status field
    
    let eventType: string;
    let eventData: any;

    // Handle different webhook payload formats
    if (event.event) {
      // Standard format: { event: "...", data: {...} }
      eventType = event.event;
      eventData = event.data;
    } else if (event.type) {
      // Alternative format with "type" instead of "event"
      eventType = event.type;
      eventData = event.data;
    } else if (event.status || event.tx_ref) {
      // Direct data format - treat as charge.completed
      eventType = "charge.completed";
      eventData = event;
    } else {
      console.error("Unknown Flutterwave webhook format:", JSON.stringify(event));
      // Still return 200 to acknowledge receipt and prevent retries
      return NextResponse.json({ received: true, error: "Unknown format" });
    }

    if (!eventType || !eventData) {
      console.error("Missing event type or data:", { eventType, hasData: !!eventData });
      return NextResponse.json(
        { error: "Invalid webhook structure" },
        { status: 400 }
      );
    }

    console.log(`Processing Flutterwave webhook: ${eventType}`);

    // Do something (that doesn't take too long) with the payload
    // Use Convex action for async processing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await convex.action((api as any)["payments/actions"].handleFlutterwaveWebhook, {
      event: eventType,
      data: eventData,
    });

    console.log(`Webhook processed successfully: ${eventType}`);

    // Respond with 200 to acknowledge receipt
    return NextResponse.json({ received: true, processed: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error processing Flutterwave webhook:", {
      error: errorMessage,
      stack: errorStack,
      event: event,
    });
    
    // For most errors, return 200 to prevent Flutterwave from retrying
    // Only return 500 for truly recoverable errors
    const statusCode = errorMessage.includes("Invalid") || errorMessage.includes("Unknown") ? 200 : 500;
    
    return NextResponse.json(
      { 
        error: "Webhook processing failed",
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}

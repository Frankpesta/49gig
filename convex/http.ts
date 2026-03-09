import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

// Use require to avoid TS2589 when accessing api.payments.actions.handleFlutterwaveWebhook
const { api } = require("./_generated/api");

const http = httpRouter();

/**
 * Flutterwave webhook endpoint - receives payment events directly.
 * Configure in Flutterwave Dashboard: https://<deployment>.convex.site/flutterwave-webhook
 * Set FLUTTERWAVE_WEBHOOK_SECRET in Convex Dashboard env vars.
 */
http.route({
  path: "/flutterwave-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secretHash =
      process.env.FLUTTERWAVE_WEBHOOK_SECRET ?? process.env.FLW_SECRET_HASH ?? "";

    const signature =
      request.headers.get("verif-hash") ??
      request.headers.get("flutterwave-signature");

    if (!secretHash) {
      console.error("Flutterwave webhook: FLUTTERWAVE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!signature || signature !== secretHash) {
      console.error("Flutterwave webhook: signature verification failed", {
        hasSignature: !!signature,
        hasSecret: !!secretHash,
      });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let event: unknown;
    try {
      event = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = event as Record<string, unknown>;
    let eventType: string;
    let eventData: unknown;

    if (body.event && typeof body.event === "string") {
      eventType = body.event;
      eventData = body.data;
    } else if (body.type && typeof body.type === "string") {
      eventType = body.type;
      eventData = body.data;
    } else if (body.status != null || body.tx_ref != null) {
      eventType = "charge.completed";
      eventData = body;
    } else {
      console.warn("Flutterwave webhook: unknown format", {
        keys: Object.keys(body),
      });
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!eventType || eventData == null) {
      return new Response(
        JSON.stringify({ error: "Invalid structure" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      await ctx.runAction(api.payments.actions.handleFlutterwaveWebhook, {
        event: eventType,
        data: eventData,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Flutterwave webhook processing failed:", msg, err);
      return new Response(
        JSON.stringify({ error: "Processing failed", message: msg }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;

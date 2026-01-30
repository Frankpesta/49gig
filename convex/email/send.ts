"use node";

import { Resend } from "resend";
import { render } from "@react-email/render";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom =
  process.env.RESEND_FROM_EMAIL || "49GIG <noreply@notifications.49gig.com>";

if (!resendApiKey) {
  console.warn("[EMAIL] RESEND_API_KEY is not set. Emails will not be sent.");
} else {
  console.log("[EMAIL] Resend configured. From:", defaultFrom);
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({
  to,
  subject,
  react,
  attachments,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  attachments?: {
    filename: string;
    content: string;
    contentType?: string;
  }[];
}) {
  const toList = Array.isArray(to) ? to : [to];
  console.log("[EMAIL] sendEmail called:", {
    to: toList,
    subject,
    hasReact: !!react,
    attachmentCount: attachments?.length ?? 0,
    resendConfigured: !!resend,
    from: defaultFrom,
  });

  if (!resend) {
    console.warn("[EMAIL] Skipping send — no Resend client (RESEND_API_KEY missing?).");
    return { id: "skipped", status: "skipped" };
  }

  try {
    const html = await render(react);
    const text = await render(react, { plainText: true });
    console.log("[EMAIL] Rendered HTML length:", html?.length ?? 0, "text length:", text?.length ?? 0);

    const result = await resend.emails.send({
      from: defaultFrom,
      to,
      subject,
      html,
      text,
      attachments,
    });

    if (result.error) {
      console.error("[EMAIL] Resend API error:", {
        error: result.error,
        to: toList,
        subject,
      });
    } else {
      console.log("[EMAIL] Sent successfully:", {
        id: result.data?.id,
        to: toList,
        subject,
      });
    }
    return result;
  } catch (err) {
    console.error("[EMAIL] sendEmail threw:", err);
    throw err;
  }
}

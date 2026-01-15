"use node";

import { Resend } from "resend";
import { render } from "@react-email/render";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.RESEND_FROM_EMAIL || "49GIG <noreply@49gig.com>";

if (!resendApiKey) {
  // Avoid crashing in environments without email configured
  // eslint-disable-next-line no-console
  console.warn("RESEND_API_KEY is not set. Emails will not be sent.");
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
  if (!resend) {
    return { id: "skipped", status: "skipped" };
  }

  const html = await render(react);
  const text = await render(react, { plainText: true });

  return resend.emails.send({
    from: defaultFrom,
    to,
    subject,
    html,
    text,
    attachments,
  });
}

import * as React from "react";

export function ProjectAdminCancelledEmail({
  recipientName,
  projectName,
  roleLabel,
  dashboardUrl,
  appUrl,
}: {
  recipientName: string;
  projectName: string;
  roleLabel: "client" | "freelancer";
  dashboardUrl: string;
  appUrl: string;
}) {
  const line =
    roleLabel === "client"
      ? "An administrator has cancelled this hire. If you had pending dispute refund holds or remaining escrow, those amounts were credited to your 49GIG wallet where applicable."
      : "An administrator has cancelled this hire. Please stop billable work on this project in the app.";

  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: 1.5 }}>
      <p>Hi {recipientName},</p>
      <p>
        <strong>{projectName}</strong> has been <strong>cancelled by an administrator</strong>.
      </p>
      <p>{line}</p>
      <p>
        <a href={dashboardUrl}>Open your dashboard</a>
        {appUrl ? ` · ${appUrl}` : null}
      </p>
      <p>— 49GIG</p>
    </div>
  );
}

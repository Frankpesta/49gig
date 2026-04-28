import * as React from "react";
import { Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailLayout } from "../components/EmailLayout";
import { textStyle } from "../components/styles";

export function ProjectAdminCancelledEmail({
  recipientName,
  projectName,
  roleLabel,
  dashboardUrl,
  appUrl,
  logoUrl,
  date,
}: {
  recipientName: string;
  projectName: string;
  roleLabel: "client" | "freelancer";
  dashboardUrl: string;
  appUrl: string;
  logoUrl?: string;
  date: string;
}) {
  const line =
    roleLabel === "client"
      ? "An administrator has cancelled this hire. If you had pending dispute refund holds or remaining escrow, those amounts were credited to your 49GIG wallet where applicable."
      : "An administrator has cancelled this hire. Please stop billable work on this project in the app.";

  return (
    <EmailLayout
      preview={`${projectName} has been cancelled by an administrator.`}
      heroLabel="Hire Cancelled"
      heroTitle="This hire has been cancelled."
      heroSubtitle="Sign in to your dashboard for details and next steps."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{recipientName}</strong>,
      </Text>
      <Text style={textStyle}>
        <strong>{projectName}</strong> has been <strong>cancelled by an administrator</strong>.
      </Text>
      <Text style={textStyle}>{line}</Text>
      <EmailButton href={dashboardUrl}>Open dashboard</EmailButton>
    </EmailLayout>
  );
}

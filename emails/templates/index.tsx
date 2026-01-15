import { Text, Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailList } from "../components/EmailList";

const textStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 12px",
};

interface BaseEmailProps {
  name?: string;
  appUrl: string;
  logoUrl: string;
  date: string;
}

export function WelcomeEmail({
  name = "there",
  role,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { role: "client" | "freelancer" }) {
  const isClient = role === "client";
  return (
    <EmailLayout
      title={`Welcome to 49GIG, ${name}`}
      preview="Meet your dedicated talent platform."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        I am the CEO of 49GIG. We built this platform to connect world class
        African talent with teams that value quality and speed. I am excited to
        have you here.
      </Text>
      {isClient ? (
        <>
          <Text style={textStyle}>
            As a client, you can post projects, review vetted profiles, and hire
            quickly. Our team will help you find the right match fast.
          </Text>
          <EmailButton href={`${appUrl}/dashboard/projects/create`}>
            Post your first project
          </EmailButton>
        </>
      ) : (
        <>
          <Text style={textStyle}>
            As a freelancer, you will showcase your skills, complete
            verification, and get matched with high quality projects.
          </Text>
          <EmailButton href={`${appUrl}/resume-upload`}>
            Upload your resume
          </EmailButton>
        </>
      )}
      <Text style={{ ...textStyle, marginTop: "16px" }}>
        Thank you for trusting 49GIG. We are here if you need anything.
      </Text>
      <Text style={{ ...textStyle, fontWeight: 600 }}>- The 49GIG CEO</Text>
    </EmailLayout>
  );
}

export function VerificationEmail({
  name = "there",
  verifyUrl,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { verifyUrl: string }) {
  return (
    <EmailLayout
      title="Verify your email"
      preview="Confirm your email to activate your account."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, please verify your email address to activate your account.
      </Text>
      <EmailButton href={verifyUrl}>Verify email</EmailButton>
      <Text style={{ ...textStyle, marginTop: "16px" }}>
        If you did not create an account, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

export function PasswordResetEmail({
  name = "there",
  resetUrl,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { resetUrl: string }) {
  return (
    <EmailLayout
      title="Reset your password"
      preview="Use this link to reset your password."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, click the button below to reset your password. This link will
        expire soon.
      </Text>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
    </EmailLayout>
  );
}

export function PasswordChangedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Your password was changed"
      preview="If this was not you, contact support immediately."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your password was successfully changed. If you did not
        perform this action, please secure your account immediately.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/settings`}>
        Review security settings
      </EmailButton>
    </EmailLayout>
  );
}

export function SecurityAlertEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
  device,
  location,
  time,
}: BaseEmailProps & { device: string; location: string; time: string }) {
  return (
    <EmailLayout
      title="New sign-in alert"
      preview="We noticed a new login to your account."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a new sign-in was detected from {device} in {location} at
        {` ${time}`}.
      </Text>
      <Text style={textStyle}>
        If this was not you, please reset your password.
      </Text>
      <EmailButton href={`${appUrl}/forgot-password`}>
        Secure my account
      </EmailButton>
    </EmailLayout>
  );
}

export function ResumeUploadedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Resume received"
      preview="We are processing your resume now."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your resume is uploaded and is now being processed. We will
        generate your executive summary shortly.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/profile`}>
        View profile
      </EmailButton>
    </EmailLayout>
  );
}

export function ResumeProcessedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Executive summary ready"
      preview="Your resume has been parsed successfully."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we finished processing your resume and generated your
        executive summary.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/profile`}>
        Review executive summary
      </EmailButton>
    </EmailLayout>
  );
}

export function ResumeFailedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Resume processing failed"
      preview="Please reupload your resume."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we could not process your resume. Please upload a new PDF so
        we can generate your executive summary.
      </Text>
      <EmailButton href={`${appUrl}/resume-upload`}>Reupload resume</EmailButton>
    </EmailLayout>
  );
}

export function VerificationStartedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Verification started"
      preview="We have started your verification."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your verification is now in progress. We will notify you once
        it is complete.
      </Text>
    </EmailLayout>
  );
}

export function VerificationApprovedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="Verification approved"
      preview="Your account is verified."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Congratulations {name}, your verification is approved. You can now
        access the dashboard.
      </Text>
      <EmailButton href={`${appUrl}/dashboard`}>Go to dashboard</EmailButton>
    </EmailLayout>
  );
}

export function VerificationRejectedEmail({
  name = "there",
  reason,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { reason?: string }) {
  return (
    <EmailLayout
      title="Verification needs attention"
      preview="Please review your verification details."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we could not approve your verification yet.
      </Text>
      {reason && <Text style={textStyle}>Reason: {reason}</Text>}
      <EmailButton href={`${appUrl}/verification`}>Continue verification</EmailButton>
    </EmailLayout>
  );
}

export function ProfileIncompleteEmail({
  name = "there",
  missingItems,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { missingItems: string[] }) {
  return (
    <EmailLayout
      title="Complete your profile"
      preview="Finish your profile to improve matches."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your profile is almost complete. Please update the following:
      </Text>
      <EmailList items={missingItems} />
      <EmailButton href={`${appUrl}/dashboard/profile`}>Update profile</EmailButton>
    </EmailLayout>
  );
}

export function ClientOnboardingCompleteEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      title="You are ready to hire"
      preview="Your client profile is complete."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your client profile is complete. You can now post projects and
        start reviewing matches.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects/create`}>
        Post a project
      </EmailButton>
    </EmailLayout>
  );
}

export function ProjectIntakeSubmittedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Project intake received"
      preview="We are reviewing your project."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we received your project intake for {projectName}. We will
        start matching you with top talent.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View project</EmailButton>
    </EmailLayout>
  );
}

export function TeamRequestSubmittedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Team request received"
      preview="We are assembling your team."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we received your team request for {projectName}. We will send
        a proposal once we have the best fit.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Track status</EmailButton>
    </EmailLayout>
  );
}

export function MatchFoundClientEmail({
  name = "there",
  freelancerName,
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { freelancerName: string; projectName: string }) {
  return (
    <EmailLayout
      title="New match ready"
      preview="A vetted freelancer has been matched."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, we matched {freelancerName} to your project {projectName}.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/opportunities`}>
        Review match
      </EmailButton>
    </EmailLayout>
  );
}

export function OpportunityMatchFreelancerEmail({
  name = "there",
  projectName,
  clientName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; clientName: string }) {
  return (
    <EmailLayout
      title="New opportunity match"
      preview="A new project is ready for you."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, you have been matched to {projectName} with {clientName}.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/opportunities`}>
        View opportunity
      </EmailButton>
    </EmailLayout>
  );
}

export function InterviewRequestEmail({
  name = "there",
  otherParty,
  appUrl,
  logoUrl,
  date,
  interviewUrl,
}: BaseEmailProps & { otherParty: string; interviewUrl: string }) {
  return (
    <EmailLayout
      title="Interview requested"
      preview="A client wants to schedule an interview."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, {otherParty} requested an interview. Please confirm a time.
      </Text>
      <EmailButton href={interviewUrl}>Schedule interview</EmailButton>
    </EmailLayout>
  );
}

export function InterviewConfirmedEmail({
  name = "there",
  otherParty,
  schedule,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { otherParty: string; schedule: string }) {
  return (
    <EmailLayout
      title="Interview confirmed"
      preview="Your interview is scheduled."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your interview with {otherParty} is confirmed for {schedule}.
      </Text>
    </EmailLayout>
  );
}

export function OfferSentEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
  offerUrl,
}: BaseEmailProps & { projectName: string; offerUrl: string }) {
  return (
    <EmailLayout
      title="Offer sent"
      preview="A new offer is waiting for you."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a new offer for {projectName} is ready for your review.
      </Text>
      <EmailButton href={offerUrl}>Review offer</EmailButton>
    </EmailLayout>
  );
}

export function OfferAcceptedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Offer accepted"
      preview="Your offer has been accepted."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the offer for {projectName} has been accepted.
      </Text>
    </EmailLayout>
  );
}

export function OfferDeclinedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Offer declined"
      preview="Your offer was declined."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the offer for {projectName} was declined. You can submit a new
        offer or contact support for help.
      </Text>
    </EmailLayout>
  );
}

export function ContractReadyEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
  contractUrl,
}: BaseEmailProps & { projectName: string; contractUrl: string }) {
  return (
    <EmailLayout
      title="Contract ready"
      preview="Your contract is ready to review."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the contract for {projectName} is ready. A signed PDF is
        attached and can also be downloaded below.
      </Text>
      <EmailButton href={contractUrl}>Download contract</EmailButton>
    </EmailLayout>
  );
}

export function ProjectCreatedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Project created"
      preview="Your project workspace is ready."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your project {projectName} has been created.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Open project</EmailButton>
    </EmailLayout>
  );
}

export function MilestoneCreatedEmail({
  name = "there",
  projectName,
  milestoneName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; milestoneName: string }) {
  return (
    <EmailLayout
      title="New milestone created"
      preview="A new milestone has been added."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a new milestone "{milestoneName}" was created for {projectName}.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View milestones</EmailButton>
    </EmailLayout>
  );
}

export function MilestoneApprovedEmail({
  name = "there",
  projectName,
  milestoneName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; milestoneName: string }) {
  return (
    <EmailLayout
      title="Milestone approved"
      preview="Milestone approved successfully."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the milestone "{milestoneName}" for {projectName} has been
        approved.
      </Text>
    </EmailLayout>
  );
}

export function MilestoneRejectedEmail({
  name = "there",
  projectName,
  milestoneName,
  reason,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; milestoneName: string; reason?: string }) {
  return (
    <EmailLayout
      title="Milestone needs revisions"
      preview="The milestone was not approved."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the milestone "{milestoneName}" for {projectName} needs
        revisions.
      </Text>
      {reason && <Text style={textStyle}>Reason: {reason}</Text>}
    </EmailLayout>
  );
}

export function ProjectCompletedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Project completed"
      preview="Congratulations on completing your project."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your project {projectName} is marked as completed. Thank you
        for working with 49GIG.
      </Text>
    </EmailLayout>
  );
}

export function ActivityDigestEmail({
  name = "there",
  items,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { items: string[] }) {
  return (
    <EmailLayout
      title="Your weekly activity summary"
      preview="A quick summary of your recent activity."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>Hi {name}, here is a quick summary:</Text>
      <EmailList items={items} />
      <EmailButton href={`${appUrl}/dashboard`}>Open dashboard</EmailButton>
    </EmailLayout>
  );
}

export function EscrowFundedEmail({
  name = "there",
  amount,
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; projectName: string }) {
  return (
    <EmailLayout
      title="Escrow funded"
      preview="Payment has been secured."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, escrow for {projectName} has been funded for {amount}.
      </Text>
    </EmailLayout>
  );
}

export function PaymentReleasedEmail({
  name = "there",
  amount,
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; projectName: string }) {
  return (
    <EmailLayout
      title="Payment released"
      preview="Your payment has been released."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, payment of {amount} for {projectName} has been released.
      </Text>
    </EmailLayout>
  );
}

export function RefundIssuedEmail({
  name = "there",
  amount,
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; projectName: string }) {
  return (
    <EmailLayout
      title="Refund issued"
      preview="Your refund is on its way."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a refund of {amount} for {projectName} has been issued.
      </Text>
    </EmailLayout>
  );
}

export function PaymentFailedEmail({
  name = "there",
  amount,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string }) {
  return (
    <EmailLayout
      title="Payment failed"
      preview="Please update your payment method."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a payment of {amount} failed. Please update your payment
        method to continue.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/settings`}>
        Update payment method
      </EmailButton>
    </EmailLayout>
  );
}

export function InvoiceReceiptEmail({
  name = "there",
  amount,
  invoiceUrl,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; invoiceUrl: string }) {
  return (
    <EmailLayout
      title="Your receipt"
      preview="Download your receipt."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your receipt for {amount} is ready.
      </Text>
      <EmailButton href={invoiceUrl}>Download receipt</EmailButton>
    </EmailLayout>
  );
}

export function DisputeOpenedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Dispute opened"
      preview="A dispute has been opened."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, a dispute has been opened for {projectName}. Our team will
        review and respond.
      </Text>
    </EmailLayout>
  );
}

export function DisputeResolvedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      title="Dispute resolved"
      preview="Your dispute has been resolved."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, the dispute for {projectName} has been resolved. Check your
        dashboard for details.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/disputes`}>
        View dispute
      </EmailButton>
    </EmailLayout>
  );
}

export function SupportTicketCreatedEmail({
  name = "there",
  ticketId,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { ticketId: string }) {
  return (
    <EmailLayout
      title="Support ticket created"
      preview="We have received your request."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your support ticket {ticketId} has been created.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/support`}>
        View ticket
      </EmailButton>
    </EmailLayout>
  );
}

export function SupportTicketUpdatedEmail({
  name = "there",
  ticketId,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { ticketId: string }) {
  return (
    <EmailLayout
      title="Support ticket updated"
      preview="There is an update on your ticket."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your support ticket {ticketId} has a new update.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/support`}>
        View update
      </EmailButton>
    </EmailLayout>
  );
}

export function SupportTicketClosedEmail({
  name = "there",
  ticketId,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { ticketId: string }) {
  return (
    <EmailLayout
      title="Support ticket closed"
      preview="Your ticket has been closed."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, your support ticket {ticketId} has been closed. Reply to this
        email if you need more help.
      </Text>
    </EmailLayout>
  );
}

export function AdminFreelancerPendingEmail({
  name = "there",
  freelancerName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { freelancerName: string }) {
  return (
    <EmailLayout
      title="New freelancer pending verification"
      preview="Verification queue update."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, {freelancerName} is ready for verification review.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/verification`}>
        Review verification
      </EmailButton>
    </EmailLayout>
  );
}

export function AdminDisputeReviewEmail({
  name = "there",
  disputeId,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { disputeId: string }) {
  return (
    <EmailLayout
      title="Dispute requires review"
      preview="A dispute needs admin attention."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi {name}, dispute {disputeId} requires review.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/disputes`}>
        Review dispute
      </EmailButton>
    </EmailLayout>
  );
}

export function AdminKycDigestEmail({
  name = "there",
  items,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { items: string[] }) {
  return (
    <EmailLayout
      title="Verification queue summary"
      preview="Daily verification summary."
      appUrl={appUrl}
      logoUrl={logoUrl}
      date={date}
    >
      <Text style={textStyle}>Hi {name}, here is the daily summary:</Text>
      <EmailList items={items} />
      <EmailButton href={`${appUrl}/dashboard/verification`}>
        Open verification queue
      </EmailButton>
    </EmailLayout>
  );
}

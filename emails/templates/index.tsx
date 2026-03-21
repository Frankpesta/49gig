import { Text, Section, Row, Column, Hr } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailList } from "../components/EmailList";
import { tokens } from "../components/EmailLayout";
import { textStyle, mutedTextStyle, sectionLabelStyle } from "../components/styles";

const sans = '"Plus Jakarta Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ─── Shared base props ────────────────────────────────────────────────────────
interface BaseEmailProps {
  name?: string;
  appUrl: string;
  logoUrl?: string;
  date: string;
}

// ─── Benefit card helper (used in welcome emails) ─────────────────────────────
function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        backgroundColor: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "10px",
        padding: "16px 18px",
      }}
    >
      <Text
        style={{
          fontFamily: sans,
          fontSize: "20px",
          margin: "0 0 8px",
          lineHeight: "1",
        }}
      >
        {icon}
      </Text>
      <Text
        style={{
          fontFamily: sans,
          fontSize: "13px",
          fontWeight: "700",
          color: tokens.textPrimary,
          margin: "0 0 5px",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: sans,
          fontSize: "12px",
          color: tokens.textMuted,
          lineHeight: "1.65",
          margin: "0",
        }}
      >
        {description}
      </Text>
    </div>
  );
}

// ─── Info row helper (used in session, security alert, etc.) ──────────────────
function InfoBlock({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <Section
      style={{
        backgroundColor: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "10px",
        padding: "18px 20px",
        marginBottom: "20px",
      }}
    >
      {rows.map((r, i) => (
        <Row key={i} style={{ marginBottom: i < rows.length - 1 ? "10px" : "0" }}>
          <Column style={{ width: "110px", verticalAlign: "top" }}>
            <Text
              style={{
                fontFamily: sans,
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                color: tokens.textMuted,
                margin: "0",
              }}
            >
              {r.label}
            </Text>
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <Text
              style={{
                fontFamily: sans,
                fontSize: "13.5px",
                color: tokens.textPrimary,
                margin: "0",
                fontWeight: "600",
              }}
            >
              {r.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

// ─── OTP / code display helper ────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  return (
    <Section
      style={{
        backgroundColor: tokens.navy,
        borderRadius: "12px",
        padding: "24px 28px",
        textAlign: "center" as const,
        margin: "4px 0 20px",
        borderBottom: `3px solid ${tokens.gold}`,
      }}
    >
      <Text
        style={{
          fontFamily: sans,
          fontSize: "10px",
          fontWeight: "700",
          letterSpacing: "3px",
          textTransform: "uppercase" as const,
          color: tokens.gold,
          margin: "0 0 12px",
        }}
      >
        Your code
      </Text>
      <Text
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "34px",
          fontWeight: "700",
          letterSpacing: "10px",
          color: tokens.white,
          margin: "0",
          lineHeight: "1",
        }}
      >
        {code}
      </Text>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH & ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════

export function WelcomeClientEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
  dashboardUrl,
}: BaseEmailProps & { dashboardUrl?: string }) {
  return (
    <EmailLayout
      preview={`Welcome to 49GIG, ${name} — your next great hire starts here.`}
      heroLabel="Welcome Aboard"
      heroTitle="Your next great hire starts here."
      heroAccent="here."
      heroSubtitle="You've joined a platform purpose-built to connect you with Africa's most talented professionals — fast, confidently, and without compromise."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Welcome to 49GIG, <strong>{name}</strong>.
      </Text>
      <Text style={{ ...textStyle, marginBottom: "28px" }}>
        We're glad to have you. 49GIG exists to make hiring exceptional African talent the easiest decision you ever make. Whether you need a specialist for a short-term project or a long-term partner, you'll find the right fit here.
      </Text>

      <Text style={sectionLabelStyle}>What you get as a client</Text>

      <Row style={{ marginBottom: "10px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="🎯" title="Vetted Talent Only" description="Every freelancer is reviewed for skill and professionalism before they're visible to you." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="⚡" title="Fast Matching" description="Browse profiles and connect with the right professional quickly — no back-and-forth." />
        </Column>
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="🔒" title="Secure Payments" description="Funds are held in escrow until work is delivered to your satisfaction." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="📋" title="Clear Milestones" description="Structure every engagement with defined deliverables and milestone-based releases." />
        </Column>
      </Row>
      <Row style={{ marginBottom: "28px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="💬" title="Built-in Messaging" description="Communicate directly with hired talent inside the platform — all in one place." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="⭐" title="Reputation System" description="Verified ratings give you the full picture before you decide — hire with confidence." />
        </Column>
      </Row>

      <EmailButton href={dashboardUrl ?? `${appUrl}/dashboard`} message="Your dashboard is ready. Explore verified freelancers across dozens of categories and find your next collaborator today.">
        Explore Talent
      </EmailButton>

      <Text style={mutedTextStyle}>
        If you ever need help navigating the platform, our support team is always a message away — right from your dashboard.
      </Text>
    </EmailLayout>
  );
}

export function WelcomeFreelancerEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
  profileUrl,
}: BaseEmailProps & { profileUrl?: string }) {
  return (
    <EmailLayout
      preview={`Welcome to 49GIG, ${name} — your skills deserve a global stage.`}
      heroLabel="Welcome to the Network"
      heroTitle="Your skills deserve a global stage."
      heroAccent="global stage."
      heroSubtitle="49GIG connects Africa's top freelance talent with clients who value quality, speed, and professionalism. You're exactly where you should be."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Welcome, <strong>{name}</strong>.
      </Text>
      <Text style={{ ...textStyle, marginBottom: "28px" }}>
        You've joined a growing community of Africa's most skilled independent professionals. 49GIG was built to give talented people like you real access to quality clients, fair pay, and the freedom to work on your terms.
      </Text>

      <Text style={sectionLabelStyle}>What you get as a freelancer</Text>

      <Row style={{ marginBottom: "10px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="🌍" title="Quality Clients" description="Get discovered by serious clients — local and international — looking for your exact skill set." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="💰" title="Guaranteed Payments" description="Client funds are secured before work begins. You deliver, you get paid — every time." />
        </Column>
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="🏆" title="Build Your Reputation" description="Earn verified reviews that build credibility and attract better clients over time." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="📁" title="Professional Profile" description="Showcase your portfolio, skills, and past work in a profile designed to convert visits into contracts." />
        </Column>
      </Row>
      <Row style={{ marginBottom: "28px" }}>
        <Column style={{ width: "50%", paddingRight: "6px" }}>
          <BenefitCard icon="🤝" title="Structured Engagements" description="Clear milestones and scoped deliverables mean fewer surprises for both sides." />
        </Column>
        <Column style={{ width: "50%", paddingLeft: "6px" }}>
          <BenefitCard icon="📈" title="Grow Your Career" description="Top-rated freelancers get priority placement and premium client access." />
        </Column>
      </Row>

      <EmailButton href={profileUrl ?? `${appUrl}/profile/setup`} message="Complete your profile now — a strong first impression is your best asset. Add your skills, portfolio, and rate to start getting noticed.">
        Complete Your Profile
      </EmailButton>

      <Text style={mutedTextStyle}>
        Your profile is live the moment it's complete. Clients are searching right now — make sure you're ready to be found.
      </Text>
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
      preview="Confirm your email to activate your 49GIG account."
      heroLabel="One Step Left"
      heroTitle="Verify your email address."
      heroSubtitle="Just one click to activate your account and get started."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, please verify your email address to activate your account. This link will expire in 24 hours.
      </Text>
      <EmailButton href={verifyUrl}>Verify Email Address</EmailButton>
      <Text style={mutedTextStyle}>
        If you did not create a 49GIG account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export function VerificationCodeEmail({
  name = "there",
  code,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { code: string }) {
  return (
    <EmailLayout
      preview="Enter this 6-digit code to verify your email and activate your account."
      heroLabel="Account Verification"
      heroTitle="Your verification code is ready."
      heroSubtitle="Enter the code below to activate your 49GIG account."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, welcome to 49GIG! Enter the code below on the verification page to complete your sign-up.
      </Text>
      <CodeBlock code={code} />
      <Text style={textStyle}>
        This code expires in <strong>24 hours</strong>. Enter it on the verification page to complete your sign-up.
      </Text>
      <Text style={mutedTextStyle}>
        If you did not create an account, you can safely ignore this email.
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
      preview="Reset your 49GIG password — link expires soon."
      heroLabel="Account Security"
      heroTitle="Reset your password."
      heroSubtitle="Use the link below to set a new password for your account."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we received a request to reset your password. Click below to choose a new one. This link will expire soon.
      </Text>
      <EmailButton href={resetUrl}>Reset Password</EmailButton>
      <Text style={mutedTextStyle}>
        If you did not request a password reset, you can ignore this email — your account remains secure.
      </Text>
    </EmailLayout>
  );
}

export function TwoFactorCodeEmail({
  name = "there",
  code,
  purpose,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { code: string; purpose: string }) {
  return (
    <EmailLayout
      preview="Your 49GIG verification code — expires in 10 minutes."
      heroLabel="Two-Factor Authentication"
      heroTitle="Your sign-in code."
      heroSubtitle={`Use this code to ${purpose}.`}
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, use the code below to {purpose}.
      </Text>
      <CodeBlock code={code} />
      <Text style={textStyle}>
        This code expires in <strong>10 minutes</strong>.
      </Text>
      <Text style={mutedTextStyle}>
        If you did not request this code, please secure your account immediately.
      </Text>
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
      preview="Your 49GIG password was changed — review if this wasn't you."
      heroLabel="Security Notice"
      heroTitle="Your password was changed."
      heroSubtitle="If you made this change, no action is needed. If not, secure your account immediately."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your password was successfully changed. If you performed this action, you're all set.
      </Text>
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        If you did not make this change, please secure your account right away.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/settings`}>Review Security Settings</EmailButton>
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
      preview="New sign-in detected on your 49GIG account."
      heroLabel="Security Alert"
      heroTitle="A new sign-in was detected."
      heroSubtitle="We noticed account activity that may not have been you."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a new sign-in was detected on your account.
      </Text>
      <InfoBlock
        rows={[
          { label: "Device", value: device },
          { label: "Location", value: location },
          { label: "Time", value: time },
        ]}
      />
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        If this was you, no action is needed. If you don't recognise this activity, please reset your password immediately.
      </Text>
      <EmailButton href={`${appUrl}/forgot-password`}>Secure My Account</EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE & RESUME
// ═══════════════════════════════════════════════════════════════════════════════

export function ResumeUploadedEmail({
  name = "there",
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps) {
  return (
    <EmailLayout
      preview="Your resume has been received — we're processing it now."
      heroLabel="Resume Received"
      heroTitle="We've got your resume."
      heroSubtitle="Our system is processing it now and will generate your executive summary shortly."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your resume has been uploaded and is currently being processed. We'll notify you as soon as your executive summary is ready.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/profile`}>View Profile</EmailButton>
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
      preview="Your executive summary is ready to review on 49GIG."
      heroLabel="Profile Update"
      heroTitle="Your executive summary is ready."
      heroSubtitle="We've finished parsing your resume — take a look and make sure everything looks right."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we've finished processing your resume and generated your executive summary. Review it now and make any edits before clients see your profile.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/profile`}>Review Executive Summary</EmailButton>
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
      preview="We couldn't process your resume — please try again."
      heroLabel="Action Required"
      heroTitle="Resume processing failed."
      heroSubtitle="We were unable to read your file. Please upload a new version so we can generate your summary."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, unfortunately we couldn't process your resume. This is usually caused by a corrupted or unsupported file format. Please upload a new PDF and we'll try again.
      </Text>
      <EmailButton href={`${appUrl}/resume-upload`}>Re-upload Resume</EmailButton>
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
      preview="Your 49GIG verification is underway."
      heroLabel="Verification"
      heroTitle="Your verification is in progress."
      heroSubtitle="We've started reviewing your submitted details. We'll notify you once it's complete."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your verification is now in progress. Our team is reviewing your details and will notify you as soon as a decision has been made.
      </Text>
      <Text style={mutedTextStyle}>
        This typically takes 1–2 business days. You'll receive an email either way.
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
      preview="Congratulations — your 49GIG account is now verified."
      heroLabel="Verification Approved"
      heroTitle="You're verified. Welcome in."
      heroAccent="Welcome in."
      heroSubtitle="Your account is fully verified. You now have complete access to the 49GIG platform."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Congratulations, <strong>{name}</strong>! Your verification has been approved. Your profile is now visible to clients and you have full access to the platform.
      </Text>
      <EmailButton href={`${appUrl}/dashboard`} message="Everything is ready — head to your dashboard and start exploring opportunities.">
        Go to Dashboard
      </EmailButton>
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
      preview="Your 49GIG verification needs attention — please review."
      heroLabel="Verification Update"
      heroTitle="Your verification needs attention."
      heroSubtitle="We were unable to fully approve your verification. Please review the details below and resubmit."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, unfortunately we couldn't approve your verification at this time.
      </Text>
      {reason && (
        <InfoBlock rows={[{ label: "Reason", value: reason }]} />
      )}
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        Please review your submitted details and continue your verification. If you need help, our support team is available from your dashboard.
      </Text>
      <EmailButton href={`${appUrl}/verification`}>Continue Verification</EmailButton>
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
      preview="Your 49GIG profile is almost complete — a few things are missing."
      heroLabel="Profile Reminder"
      heroTitle="Your profile is almost there."
      heroSubtitle="A complete profile gets you matched faster. Here's what's still missing."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your profile is nearly complete. Finishing it improves your visibility and helps us match you with the right opportunities.
      </Text>
      <EmailList items={missingItems} />
      <EmailButton href={`${appUrl}/dashboard/profile`}>Complete Profile</EmailButton>
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
      preview="Your client profile is complete — you're ready to hire on 49GIG."
      heroLabel="You're All Set"
      heroTitle="Ready to find great talent."
      heroAccent="great talent."
      heroSubtitle="Your client profile is fully set up. You can now browse matches and start building your team."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your client profile is complete. You can now browse vetted profiles and start reviewing matches.
      </Text>
      <EmailButton href={`${appUrl}/dashboard`} message="Everything is in place — explore talent and kick off your first project.">
        Go to Dashboard
      </EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS & MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

export function ProjectIntakeSubmittedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      preview={`Project intake for "${projectName}" received — we're on it.`}
      heroLabel="Project Received"
      heroTitle="Your project intake is in."
      heroSubtitle="We've received your brief and are already working on finding the right talent match."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we've received your project intake for <strong>{projectName}</strong>. Our team will review it and start matching you with top talent.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Project</EmailButton>
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
      preview={`Team request for "${projectName}" received — assembling your team.`}
      heroLabel="Team Request"
      heroTitle="We're assembling your team."
      heroSubtitle="Your team request has been received. We'll send over a proposal once we've found the best fit."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we've received your team request for <strong>{projectName}</strong>. We'll be in touch with a proposal as soon as we've identified the right people.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Track Status</EmailButton>
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
      preview={`A vetted match is ready for "${projectName}" — review now.`}
      heroLabel="Match Ready"
      heroTitle="Your match is ready to review."
      heroAccent="ready"
      heroSubtitle="We've found a vetted professional that fits your project requirements."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we've matched <strong>{freelancerName}</strong> to your project <strong>{projectName}</strong>. Review their profile and decide if you'd like to move forward.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Review Match</EmailButton>
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
      preview={`New opportunity: "${projectName}" — you've been matched.`}
      heroLabel="New Opportunity"
      heroTitle="A project match is waiting."
      heroSubtitle="You've been matched to a new project that fits your skills and experience."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, you've been matched to <strong>{projectName}</strong> with <strong>{clientName}</strong>. Log in to review the project details and express your interest.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Opportunity</EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERVIEWS & OFFERS
// ═══════════════════════════════════════════════════════════════════════════════

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
      preview={`${otherParty} has requested an interview — confirm a time.`}
      heroLabel="Interview Request"
      heroTitle="An interview has been requested."
      heroSubtitle="Confirm your availability to move forward with this opportunity."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, <strong>{otherParty}</strong> has requested an interview. Please confirm a time that works for you.
      </Text>
      <EmailButton href={interviewUrl}>Schedule Interview</EmailButton>
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
      preview={`Your interview with ${otherParty} is confirmed.`}
      heroLabel="Interview Confirmed"
      heroTitle="Your interview is confirmed."
      heroSubtitle="Add it to your calendar and prepare to make a great impression."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your interview with <strong>{otherParty}</strong> has been confirmed.
      </Text>
      <InfoBlock rows={[{ label: "Scheduled", value: schedule }]} />
      <Text style={mutedTextStyle}>
        Please be on time and prepared. If you need to reschedule, contact the other party directly via the platform.
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
      preview={`A new offer for "${projectName}" is ready for your review.`}
      heroLabel="New Offer"
      heroTitle="You have a new offer."
      heroSubtitle="Review the details and let us know if you'd like to accept."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a new offer for <strong>{projectName}</strong> is ready for your review. Take a look and respond at your earliest convenience.
      </Text>
      <EmailButton href={offerUrl}>Review Offer</EmailButton>
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
      preview={`Your offer for "${projectName}" has been accepted — let's get started.`}
      heroLabel="Offer Accepted"
      heroTitle="Your offer has been accepted."
      heroAccent="accepted."
      heroSubtitle="Both parties have agreed. The next step is to get the project set up and underway."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the offer for <strong>{projectName}</strong> has been accepted. Head to your dashboard to see the next steps.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Open Project</EmailButton>
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
      preview={`Your offer for "${projectName}" was declined.`}
      heroLabel="Offer Update"
      heroTitle="Your offer was declined."
      heroSubtitle="The other party didn't move forward this time. You can submit a new offer or reach out to support."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the offer for <strong>{projectName}</strong> was declined. You're welcome to submit a revised offer or contact support if you need assistance.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Project</EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS & MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

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
      preview={`Your contract for "${projectName}" is ready to download.`}
      heroLabel="Contract Ready"
      heroTitle="Your contract is ready."
      heroSubtitle="A signed PDF has been prepared for your records. Download it below."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the contract for <strong>{projectName}</strong> is ready. A signed copy can be downloaded below and is also attached to this email.
      </Text>
      <EmailButton href={contractUrl}>Download Contract</EmailButton>
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
      preview={`"${projectName}" has been created — your workspace is ready.`}
      heroLabel="Project Created"
      heroTitle="Your project workspace is live."
      heroAccent="live."
      heroSubtitle="Everything is set up and ready for you to start collaborating."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your project <strong>{projectName}</strong> has been created. Your workspace is ready — head over to get started.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Open Project</EmailButton>
    </EmailLayout>
  );
}

export function UnfundedProjectReminderEmail({
  name = "there",
  projectName,
  daysLeft,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; daysLeft: number }) {
  return (
    <EmailLayout
      preview={`"${projectName}" is awaiting funding — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.`}
      heroLabel="Action Required"
      heroTitle="Your project is awaiting payment."
      heroSubtitle="Complete funding to keep your project active and your match in place."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your project <strong>{projectName}</strong> is still awaiting funding.
      </Text>
      <InfoBlock rows={[{ label: "Time Remaining", value: `${daysLeft} ${daysLeft === 1 ? "day" : "days"}` }]} />
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        Complete payment before the deadline to keep your project active. After this period, the project will be automatically removed.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>Complete Payment</EmailButton>
    </EmailLayout>
  );
}

export function MonthlyCyclePendingReminderEmail({
  name = "there",
  projectName,
  monthLabel,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string; monthLabel: string }) {
  return (
    <EmailLayout
      preview={`${monthLabel} payment for "${projectName}" is awaiting your approval.`}
      heroLabel="Approval Needed"
      heroTitle="Monthly payment pending your review."
      heroSubtitle="Review this month's work and approve the payment to release funds to your freelancer."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the <strong>{monthLabel}</strong> payment for <strong>{projectName}</strong> is awaiting your approval.
      </Text>
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        Please review the freelancer's submitted work and approve the payment to release their funds for this period.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/monthly-approvals`}>Review & Approve</EmailButton>
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
      preview={`New milestone "${milestoneName}" added to "${projectName}".`}
      heroLabel="Milestone Added"
      heroTitle="A new milestone has been created."
      heroSubtitle="Your project scope has been updated with a new deliverable."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a new milestone has been added to your project.
      </Text>
      <InfoBlock
        rows={[
          { label: "Milestone", value: milestoneName },
          { label: "Project", value: projectName },
        ]}
      />
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Milestones</EmailButton>
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
      preview={`Milestone "${milestoneName}" has been approved.`}
      heroLabel="Milestone Approved"
      heroTitle="Milestone approved — great work."
      heroAccent="great work."
      heroSubtitle="The client has reviewed and approved this deliverable."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the milestone <strong>"{milestoneName}"</strong> for <strong>{projectName}</strong> has been approved.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Project</EmailButton>
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
      preview={`Milestone "${milestoneName}" needs revisions.`}
      heroLabel="Revision Requested"
      heroTitle="Your milestone needs revisions."
      heroSubtitle="The client has reviewed your submission and requested some changes."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the milestone <strong>"{milestoneName}"</strong> for <strong>{projectName}</strong> requires revisions before it can be approved.
      </Text>
      {reason && <InfoBlock rows={[{ label: "Feedback", value: reason }]} />}
      <EmailButton href={`${appUrl}/dashboard/projects`}>View Project</EmailButton>
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
      preview={`"${projectName}" is complete — congratulations!`}
      heroLabel="Project Complete"
      heroTitle="Project completed. Well done."
      heroAccent="Well done."
      heroSubtitle="This project has been marked as complete. Thank you for working with 49GIG."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, <strong>{projectName}</strong> has been marked as completed. We hope it was a great experience and look forward to your next project.
      </Text>
      <EmailButton href={`${appUrl}/dashboard`}>Back to Dashboard</EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS & FINANCE
// ═══════════════════════════════════════════════════════════════════════════════

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
      preview={`Escrow for "${projectName}" has been funded — funds are secured.`}
      heroLabel="Payment Secured"
      heroTitle="Escrow funded and secured."
      heroSubtitle="Funds are now held safely in escrow and will be released upon milestone approval."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, escrow for <strong>{projectName}</strong> has been successfully funded.
      </Text>
      <InfoBlock
        rows={[
          { label: "Amount", value: amount },
          { label: "Project", value: projectName },
          { label: "Status", value: "Held in escrow" },
        ]}
      />
      <Text style={mutedTextStyle}>
        Funds will be released to the freelancer upon milestone approval. You're protected throughout.
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
      preview={`Payment of ${amount} for "${projectName}" has been released.`}
      heroLabel="Payment Released"
      heroTitle="Your payment has been released."
      heroSubtitle="Funds have been released from escrow as agreed."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, payment has been released for <strong>{projectName}</strong>.
      </Text>
      <InfoBlock
        rows={[
          { label: "Amount", value: amount },
          { label: "Project", value: projectName },
        ]}
      />
      <EmailButton href={`${appUrl}/dashboard/transactions`}>View Transactions</EmailButton>
    </EmailLayout>
  );
}

export function PayoutSentEmail({
  name = "there",
  amount,
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; projectName: string }) {
  return (
    <EmailLayout
      preview={`Your payout of ${amount} for "${projectName}" is on the way.`}
      heroLabel="Payout Sent"
      heroTitle="Your payout is on the way."
      heroAccent="on the way."
      heroSubtitle="Your earnings have been sent to your connected account and should arrive shortly."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a payout has been sent to your connected account.
      </Text>
      <InfoBlock
        rows={[
          { label: "Amount", value: amount },
          { label: "Project", value: projectName },
          { label: "Destination", value: "Connected Stripe account" },
        ]}
      />
      <EmailButton href={`${appUrl}/dashboard/transactions`}>View Transactions</EmailButton>
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
      preview={`A refund of ${amount} for "${projectName}" has been issued.`}
      heroLabel="Refund Issued"
      heroTitle="Your refund is on its way."
      heroSubtitle="The refund has been processed and will appear in your account within a few business days."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a refund has been issued for <strong>{projectName}</strong>.
      </Text>
      <InfoBlock
        rows={[
          { label: "Amount", value: amount },
          { label: "Project", value: projectName },
        ]}
      />
      <Text style={mutedTextStyle}>
        Refunds typically appear within 3–5 business days depending on your bank.
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
      preview="A payment failed on your 49GIG account — please update your payment method."
      heroLabel="Payment Failed"
      heroTitle="We couldn't process your payment."
      heroSubtitle="Please update your payment method to keep your project moving forward."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a payment of <strong>{amount}</strong> could not be processed. This may be due to insufficient funds or an expired card.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/settings`}>Update Payment Method</EmailButton>
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
      preview={`Your 49GIG receipt for ${amount} is ready to download.`}
      heroLabel="Receipt Ready"
      heroTitle="Your receipt is ready."
      heroSubtitle="Download your receipt below for your records."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your receipt for <strong>{amount}</strong> is available to download.
      </Text>
      <EmailButton href={invoiceUrl}>Download Receipt</EmailButton>
    </EmailLayout>
  );
}

export function PayoutFailedEmail({
  name = "there",
  amount,
  currency,
  reason,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { amount: string; currency: string; reason: string }) {
  return (
    <EmailLayout
      preview={`Your payout of ${amount} ${currency} could not be completed.`}
      heroLabel="Payout Failed"
      heroTitle="We couldn't complete your payout."
      heroSubtitle="There was an issue processing your payout. Please contact support to resolve this."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, we were unable to complete your payout.
      </Text>
      <InfoBlock
        rows={[
          { label: "Amount", value: `${amount} ${currency}` },
          { label: "Reason", value: reason },
        ]}
      />
      <EmailButton href={`${appUrl}/dashboard/support`}>Contact Support</EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPUTES & SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function DisputeOpenedEmail({
  name = "there",
  projectName,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { projectName: string }) {
  return (
    <EmailLayout
      preview={`A dispute has been opened for "${projectName}" — our team is reviewing.`}
      heroLabel="Dispute Opened"
      heroTitle="A dispute has been opened."
      heroSubtitle="Our team has been notified and will review the details. We aim to resolve disputes fairly and promptly."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a dispute has been opened for <strong>{projectName}</strong>. Our team is reviewing the details and will be in touch shortly.
      </Text>
      <Text style={mutedTextStyle}>
        Please ensure all relevant project communication is available via the platform chat to assist our review.
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
      preview={`The dispute for "${projectName}" has been resolved.`}
      heroLabel="Dispute Resolved"
      heroTitle="Your dispute has been resolved."
      heroSubtitle="Our team has reviewed all the details and reached a resolution."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, the dispute for <strong>{projectName}</strong> has been resolved. Check your dashboard for the full resolution details.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/disputes`}>View Resolution</EmailButton>
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
      preview={`Support ticket ${ticketId} has been created — we're on it.`}
      heroLabel="Support Request"
      heroTitle="We've received your request."
      heroSubtitle="Your ticket has been created and assigned to our support team. We'll be in touch shortly."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your support request has been received and is being reviewed.
      </Text>
      <InfoBlock rows={[{ label: "Ticket ID", value: ticketId }]} />
      <EmailButton href={`${appUrl}/dashboard/support`}>View Ticket</EmailButton>
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
      preview={`There's an update on your support ticket ${ticketId}.`}
      heroLabel="Ticket Update"
      heroTitle="Your support ticket has been updated."
      heroSubtitle="Our team has added a response to your ticket. Log in to see the latest update."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, there's a new update on your support ticket.
      </Text>
      <InfoBlock rows={[{ label: "Ticket ID", value: ticketId }]} />
      <EmailButton href={`${appUrl}/dashboard/support`}>View Update</EmailButton>
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
      preview={`Your support ticket ${ticketId} has been closed.`}
      heroLabel="Ticket Closed"
      heroTitle="Your support ticket is closed."
      heroSubtitle="We hope we were able to help. Reply to this email if you need further assistance."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your support ticket <strong>{ticketId}</strong> has been closed. If you still need help or have follow-up questions, simply reply to this email.
      </Text>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN & BROADCASTS
// ═══════════════════════════════════════════════════════════════════════════════

export function ActivityDigestEmail({
  name = "there",
  items,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & { items: string[] }) {
  return (
    <EmailLayout
      preview="Your weekly 49GIG activity summary."
      heroLabel="Weekly Summary"
      heroTitle="Your activity this week."
      heroSubtitle="Here's a quick overview of what happened on your account over the past 7 days."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, here's your weekly activity summary:
      </Text>
      <EmailList items={items} />
      <EmailButton href={`${appUrl}/dashboard`}>Open Dashboard</EmailButton>
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
      preview={`${freelancerName} is pending verification review.`}
      heroLabel="Verification Queue"
      heroTitle="A freelancer is pending review."
      heroSubtitle="A new submission is waiting in the verification queue."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, <strong>{freelancerName}</strong> has submitted their verification and is ready for review.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/verification`}>Review Verification</EmailButton>
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
      preview={`Dispute ${disputeId} requires admin review.`}
      heroLabel="Admin Action"
      heroTitle="A dispute requires your review."
      heroSubtitle="A dispute has been escalated and needs admin attention."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, a dispute requires your review.
      </Text>
      <InfoBlock rows={[{ label: "Dispute ID", value: disputeId }]} />
      <EmailButton href={`${appUrl}/dashboard/disputes`}>Review Dispute</EmailButton>
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
      preview="Daily verification queue summary — 49GIG Admin."
      heroLabel="Admin Digest"
      heroTitle="Daily verification summary."
      heroSubtitle="Here's an overview of today's verification queue activity."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, here is today's verification queue summary:
      </Text>
      <EmailList items={items} />
      <EmailButton href={`${appUrl}/dashboard/verification`}>Open Verification Queue</EmailButton>
    </EmailLayout>
  );
}

export function AdminBroadcastEmail({
  subject,
  body,
  appUrl,
  logoUrl,
  date,
}: {
  subject: string;
  body: string;
  appUrl: string;
  logoUrl?: string;
  date: string;
}) {
  return (
    <EmailLayout
      preview={body.slice(0, 100)}
      heroLabel="Message from 49GIG"
      heroTitle={subject}
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={{ ...textStyle, whiteSpace: "pre-wrap" }}>{body}</Text>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function OneOnOneSessionScheduledEmail({
  name = "there",
  projectName,
  startTimeFormatted,
  endTimeFormatted,
  meetLink,
  isTeamKickoff,
  participantNames,
  appUrl,
  logoUrl,
  date,
}: BaseEmailProps & {
  projectName: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  meetLink: string;
  isTeamKickoff?: boolean;
  participantNames?: string;
}) {
  return (
    <EmailLayout
      preview={`Your ${isTeamKickoff ? "kickoff" : "one-on-one"} session for "${projectName}" is confirmed.`}
      heroLabel={isTeamKickoff ? "Kickoff Session" : "Session Scheduled"}
      heroTitle={isTeamKickoff ? "Your kickoff session is set." : "Your session is scheduled."}
      heroAccent="set."
      heroSubtitle="Add it to your calendar and prepare for a productive conversation."
      logoUrl={logoUrl}
      appUrl={appUrl}
      date={date}
    >
      <Text style={textStyle}>
        Hi <strong>{name}</strong>, your {isTeamKickoff ? "team kickoff" : "one-on-one"} session for <strong>{projectName}</strong> has been scheduled.
      </Text>
      <InfoBlock
        rows={[
          { label: "When", value: `${startTimeFormatted} – ${endTimeFormatted}` },
          ...(participantNames ? [{ label: "With", value: participantNames }] : []),
          { label: "Project", value: projectName },
        ]}
      />
      <Text style={{ ...textStyle, marginBottom: "24px" }}>
        Join at the scheduled time using the link below. We recommend testing your camera and microphone beforehand.
      </Text>
      <EmailButton href={meetLink}>Join Google Meet</EmailButton>
      <Text style={mutedTextStyle}>
        If you need to reschedule, please contact the other participant(s) via the project chat or reach out to support.
      </Text>
    </EmailLayout>
  );
}
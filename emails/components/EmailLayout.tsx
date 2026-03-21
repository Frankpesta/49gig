import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Row,
  Column,
  Text,
  Link,
} from "@react-email/components";
import { ReactNode } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const tokens = {
  black: "#0A0A0A",
  navy: "#0D1B2A",
  navyMid: "#1B2E45",
  gold: "#F5B800",
  white: "#FFFFFF",
  offWhite: "#F5F4F0",
  border: "#ECEAE4",
  cardBg: "#F9F8F5",
  textPrimary: "#111111",
  textSecondary: "#444444",
  textMuted: "#888888",
  textFaint: "#AAAAAA",
};

const sans = '"Plus Jakarta Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
const serif = 'Georgia, "Times New Roman", serif';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface EmailLayoutProps {
  /** Inbox preview text */
  preview: string;
  /** Eyebrow label above hero headline (e.g. "New Notification") */
  heroLabel?: string;
  /** Main hero headline */
  heroTitle: string;
  /** Optional italic-gold accent word/phrase within heroTitle */
  heroAccent?: string;
  /** Hero sub-copy */
  heroSubtitle?: string;
  /** Optional: image logo URL — if omitted, text logo is used */
  logoUrl?: string;
  /** App home URL (wraps the logo) */
  appUrl: string;
  /** Sent-on date string */
  date: string;
  /** Email body content */
  children: ReactNode;
  /** Footer link overrides */
  footerLinks?: Array<{ label: string; href: string }>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  body: {
    backgroundColor: tokens.offWhite,
    margin: "0",
    padding: "0",
    fontFamily: sans,
  },
  outer: {
    padding: "32px 0",
    backgroundColor: tokens.offWhite,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: tokens.white,
    borderRadius: "16px",
    overflow: "hidden" as const,
  },

  // ── Header
  header: {
    backgroundColor: tokens.black,
    padding: "24px 40px",
  },
  logoNum: {
    fontFamily: serif,
    fontSize: "28px",
    fontWeight: "700",
    color: tokens.gold,
    display: "inline",
    lineHeight: "1",
    margin: "0",
  },
  logoWord: {
    fontFamily: sans,
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "3px",
    color: tokens.white,
    textTransform: "uppercase" as const,
    display: "inline",
    verticalAlign: "middle",
    margin: "0",
  },

  // ── Hero
  hero: {
    // background set inline because react-email doesn't support gradient shorthand in all clients
    backgroundColor: tokens.navy,
    padding: "36px 40px 30px",
    borderBottom: `3px solid ${tokens.gold}`,
  },
  heroLabel: {
    fontFamily: sans,
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    color: tokens.gold,
    margin: "0 0 12px",
  },
  heroTitle: {
    fontFamily: serif,
    fontSize: "24px",
    fontWeight: "700",
    color: tokens.white,
    lineHeight: "1.35",
    margin: "0 0 12px",
  },
  heroSubtitle: {
    fontFamily: sans,
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.68)",
    lineHeight: "1.75",
    margin: "0",
  },

  // ── Body
  bodySection: {
    padding: "32px 40px 36px",
    backgroundColor: tokens.white,
  },

  // ── Divider
  hr: {
    borderColor: tokens.border,
    margin: "0",
  },

  // ── Footer
  footer: {
    backgroundColor: tokens.offWhite,
    padding: "18px 40px 24px",
    borderTop: `1px solid ${tokens.border}`,
  },
  footerText: {
    fontFamily: sans,
    fontSize: "11px",
    color: tokens.textFaint,
    margin: "0 0 4px",
    lineHeight: "1.65",
  },
  footerLink: {
    color: tokens.textFaint,
    textDecoration: "underline",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function EmailLayout({
  preview,
  heroLabel,
  heroTitle,
  heroAccent,
  heroSubtitle,
  logoUrl,
  appUrl,
  date,
  children,
  footerLinks = [
    { label: "Help Centre", href: `${appUrl}/help` },
    { label: "Unsubscribe", href: `${appUrl}/unsubscribe` },
    { label: "Privacy", href: `${appUrl}/privacy` },
  ],
}: EmailLayoutProps) {
  // Build hero title with optional accent word
  const renderHeroTitle = () => {
    if (!heroAccent || !heroTitle.includes(heroAccent)) return heroTitle;
    const [before, after] = heroTitle.split(heroAccent);
    return (
      <>
        {before}
        <span style={{ color: tokens.gold, fontStyle: "italic" }}>{heroAccent}</span>
        {after}
      </>
    );
  };

  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Section style={s.outer}>
          <Container style={s.container}>

            {/* ── Logo Header */}
            <Section style={s.header}>
              <Link href={appUrl} style={{ textDecoration: "none" }}>
                {logoUrl ? (
                  <Img src={logoUrl} alt="49GIG" height="36" style={{ display: "block" }} />
                ) : (
                  <Text style={{ margin: 0, lineHeight: "1" }}>
                    <span style={s.logoNum}>49</span>
                    <span style={s.logoWord}>GIG</span>
                  </Text>
                )}
              </Link>
            </Section>

            {/* ── Hero Band */}
            <Section style={s.hero}>
              {heroLabel && (
                <Text style={s.heroLabel}>{heroLabel}</Text>
              )}
              <Text style={s.heroTitle}>{renderHeroTitle()}</Text>
              {heroSubtitle && (
                <Text style={s.heroSubtitle}>{heroSubtitle}</Text>
              )}
            </Section>

            {/* ── Body */}
            <Section style={s.bodySection}>
              {children}
            </Section>

            <Hr style={s.hr} />

            {/* ── Footer */}
            <Section style={s.footer}>
              <Row>
                <Column>
                  <Text style={s.footerText}>
                    Sent on {date}. If you need help, reply to this email or contact support via your dashboard.
                  </Text>
                  <Text style={s.footerText}>
                    © {new Date().getFullYear()} 49GIG. All rights reserved.
                    {"  "}
                    {footerLinks.map((lk, i) => (
                      <span key={lk.href}>
                        <Link href={lk.href} style={s.footerLink}>{lk.label}</Link>
                        {i < footerLinks.length - 1 && (
                          <span style={{ color: tokens.border }}> · </span>
                        )}
                      </span>
                    ))}
                  </Text>
                </Column>
              </Row>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export default EmailLayout;
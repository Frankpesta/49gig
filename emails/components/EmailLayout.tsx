import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { ReactNode } from "react";

interface EmailLayoutProps {
  title: string;
  preview: string;
  logoUrl: string;
  appUrl: string;
  date: string;
  children: ReactNode;
}

// Plus Jakarta Sans – matches app font (49GIG design system)
const FONT_FAMILY =
  '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const styles = {
  body: {
    backgroundColor: "#f4f5f7",
    fontFamily: FONT_FAMILY,
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "600px",
    backgroundColor: "#ffffff",
    margin: "32px auto",
    padding: 0,
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(7, 18, 43, 0.08)",
    overflow: "hidden",
  },
  header: {
    padding: "24px 32px",
    backgroundColor: "#ffffff",
    textAlign: "center" as const,
  },
  logo: {
    display: "block",
    height: "150px",
    width: "auto",
    margin: "0 auto",
  },
  logoLink: {
    display: "block",
    textAlign: "center" as const,
  },
  content: {
    padding: "0 40px 32px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#07122B",
    margin: "0 0 16px",
    lineHeight: 1.35,
  },
  text: {
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#374151",
    margin: "0 0 14px",
  },
  footer: {
    padding: "24px 40px 32px",
    backgroundColor: "#fafbfc",
  },
  footerText: {
    fontSize: "13px",
    lineHeight: 1.55,
    color: "#6b7280",
    margin: "0 0 8px",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: 0,
  },
};

export function EmailLayout({
  title,
  preview,
  logoUrl,
  appUrl,
  date,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <a href={appUrl} style={styles.logoLink}>
              <Img src={logoUrl} alt="49GIG" style={styles.logo} />
            </a>
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Sent on {date}. If you need help, reply to this email or contact
              support via your dashboard.
            </Text>
            <Text style={styles.footerText}>© 49GIG. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

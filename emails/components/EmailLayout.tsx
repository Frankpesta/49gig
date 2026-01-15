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

const styles = {
  body: {
    backgroundColor: "#f7f8fb",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "640px",
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "0",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  header: {
    padding: "24px 32px",
    backgroundColor: "#ffffff",
  },
  logo: {
    display: "block",
    height: "36px",
  },
  content: {
    padding: "0 32px 24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px",
    lineHeight: "1.3",
  },
  text: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "0 0 12px",
  },
  footer: {
    padding: "16px 32px 24px",
    backgroundColor: "#f9fafb",
    fontSize: "12px",
    color: "#6b7280",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "0",
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
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <a href={appUrl}>
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
            <Text style={styles.text}>
              Sent on {date}. If you need help, reply to this email or contact
              support via your dashboard.
            </Text>
            <Text style={styles.text}>49GIG, All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

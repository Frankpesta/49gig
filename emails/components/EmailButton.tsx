import { Button, Section, Text } from "@react-email/components";
import { ReactNode } from "react";
import { tokens } from "./EmailLayout";

const sans = '"Plus Jakarta Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

interface EmailButtonProps {
  href: string;
  children: ReactNode;
  /** Optional sub-copy above the button inside the dark block */
  message?: string;
}

export function EmailButton({ href, children, message }: EmailButtonProps) {
  return (
    <Section
      style={{
        backgroundColor: tokens.black,
        borderRadius: "12px",
        padding: message ? "24px 28px" : "20px 28px",
        textAlign: "center" as const,
        marginBottom: "24px",
      }}
    >
      {message && (
        <Text
          style={{
            fontFamily: sans,
            fontSize: "13.5px",
            color: "rgba(255,255,255,0.70)",
            lineHeight: "1.70",
            margin: "0 0 16px",
          }}
        >
          {message}
        </Text>
      )}
      <Button
        href={href}
        style={{
          backgroundColor: tokens.gold,
          color: tokens.black,
          fontFamily: sans,
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "0.6px",
          textTransform: "uppercase" as const,
          padding: "13px 28px",
          borderRadius: "8px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children} →
      </Button>
    </Section>
  );
}

export default EmailButton;
import { Button } from "@react-email/components";
import { ReactNode } from "react";

interface EmailButtonProps {
  href: string;
  children: ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#345478",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 600,
        padding: "12px 20px",
        borderRadius: "10px",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}

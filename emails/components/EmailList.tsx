import { Text, Section } from "@react-email/components";
import { tokens } from "./EmailLayout";

const sans = '"Plus Jakarta Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

interface EmailListProps {
  items: string[];
}

export function EmailList({ items }: EmailListProps) {
  return (
    <Section
      style={{
        backgroundColor: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "20px",
      }}
    >
      {items.map((item, i) => (
        <Text
          key={i}
          style={{
            fontFamily: sans,
            fontSize: "13.5px",
            color: tokens.textSecondary,
            margin: i < items.length - 1 ? "0 0 8px" : "0",
            lineHeight: "1.60",
            paddingLeft: "4px",
          }}
        >
          <span style={{ color: tokens.gold, fontWeight: "700", marginRight: "8px" }}>–</span>
          {item}
        </Text>
      ))}
    </Section>
  );
}

export default EmailList;
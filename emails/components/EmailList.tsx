import { Text } from "@react-email/components";

interface EmailListProps {
  items: string[];
}

export function EmailList({ items }: EmailListProps) {
  return (
    <>
      {items.map((item) => (
        <Text key={item} style={{ margin: "0 0 6px", color: "#4b5563" }}>
          - {item}
        </Text>
      ))}
    </>
  );
}

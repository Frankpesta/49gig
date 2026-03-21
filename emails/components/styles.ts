import { tokens } from "./EmailLayout";

const sans = '"Plus Jakarta Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Standard body paragraph style — import and spread wherever needed */
export const textStyle = {
  fontFamily: sans,
  fontSize: "14.5px",
  lineHeight: "1.78",
  color: tokens.textSecondary,
  margin: "0 0 14px",
};

/** Muted / secondary text */
export const mutedTextStyle = {
  ...textStyle,
  fontSize: "13px",
  color: tokens.textMuted,
};

/** Section label (gold uppercase) */
export const sectionLabelStyle = {
  fontFamily: sans,
  fontSize: "10px",
  fontWeight: "700" as const,
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  color: tokens.gold,
  margin: "0 0 14px",
};
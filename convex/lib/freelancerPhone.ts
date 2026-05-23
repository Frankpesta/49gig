/** Prefer profile.phoneNumber; fall back to legacy phoneE164 from old SMS verification. */
export function getFreelancerPhoneRaw(user: {
  phoneE164?: string;
  profile?: { phoneNumber?: string } | null;
}): string {
  const fromProfile = user.profile?.phoneNumber?.trim() ?? "";
  if (fromProfile) return fromProfile;
  return user.phoneE164?.trim() ?? "";
}

/** Digits-only phone for Flutterwave and payout validation. */
export function getFreelancerPhoneDigits(user: {
  phoneE164?: string;
  profile?: { phoneNumber?: string } | null;
}): string {
  return getFreelancerPhoneRaw(user).replace(/\D/g, "");
}

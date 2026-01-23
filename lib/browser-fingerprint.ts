/**
 * Browser Fingerprinting Utility
 * 
 * Generates a unique browser fingerprint for security and anti-cheat
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";

type FingerprintAgent = Awaited<ReturnType<typeof FingerprintJS.load>>;

let fpPromise: Promise<FingerprintAgent> | null = null;

/**
 * Initialize FingerprintJS
 */
function getFingerprintAgent(): Promise<FingerprintAgent> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Get browser fingerprint
 */
export async function getBrowserFingerprint(): Promise<string> {
  try {
    const agent = await getFingerprintAgent();
    const result = await agent.get();
    return result.visitorId;
  } catch (error) {
    console.error("Failed to get browser fingerprint:", error);
    // Fallback to a simple fingerprint based on available data
    return generateFallbackFingerprint();
  }
}

/**
 * Generate fallback fingerprint if FingerprintJS fails
 */
function generateFallbackFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.platform,
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fallback_${Math.abs(hash).toString(36)}`;
}

/**
 * Get IP address (client-side, may not be accurate)
 */
export async function getClientIP(): Promise<string> {
  try {
    // Use a service to get IP (you might want to do this server-side)
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to get IP address:", error);
    return "unknown";
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

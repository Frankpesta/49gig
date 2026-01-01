import bcrypt from "bcryptjs";

/**
 * Salt rounds for bcrypt hashing
 * Higher values are more secure but slower
 * 10 is a good balance between security and performance
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcryptjs (synchronous)
 * Uses synchronous methods to work in Convex mutations
 * @param plainPassword - The plain text password to hash
 * @returns The hashed password
 */
export function hashPassword(plainPassword: string): string {
  try {
    const hashedPassword = bcrypt.hashSync(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a plain text password against a hashed password (synchronous)
 * Uses synchronous methods to work in Convex mutations
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns True if the password matches, false otherwise
 */
export function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): boolean {
  try {
    const isMatch = bcrypt.compareSync(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    // If verification fails for any reason, return false
    return false;
  }
}


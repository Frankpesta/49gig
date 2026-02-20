/**
 * Error Handling Utilities
 * 
 * Provides retry logic, user-friendly error messages, and error recovery
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error occurred");
}

/**
 * Get user-friendly error message from various error types
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Start from the raw message
    let rawMessage = error.message || "";

    // Strip Convex-specific prefixes / jargon while keeping the human-readable part
    if (/convexerror:/i.test(rawMessage)) {
      // Remove leading "ConvexError: ..." prefix
      const firstColon = rawMessage.indexOf(":");
      if (firstColon !== -1) {
        rawMessage = rawMessage.slice(firstColon + 1).trim();
      }
    }

    // If Convex wrapped the original error like "Error in mutation 'x': Actual message"
    if (/error in (mutation|query)/i.test(rawMessage)) {
      const lastColon = rawMessage.lastIndexOf(":");
      if (lastColon !== -1) {
        rawMessage = rawMessage.slice(lastColon + 1).trim();
      }
    }

    const message = rawMessage.toLowerCase();

    // API errors
    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your internet connection and try again.";
    }

    if (message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    if (message.includes("unauthorized") || message.includes("401")) {
      return "You are not authorized. Please log in and try again.";
    }

    if (message.includes("forbidden") || message.includes("403")) {
      return "You don't have permission to perform this action.";
    }

    if (message.includes("not found") || message.includes("404")) {
      return "The requested resource was not found.";
    }

    if (message.includes("server error") || message.includes("500")) {
      return "Server error. Please try again later or contact support.";
    }

    if (message.includes("rate limit") || message.includes("429")) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // File upload errors
    if (message.includes("file") && message.includes("size")) {
      return "File is too large. Please upload a smaller file.";
    }

    if (message.includes("file") && message.includes("type")) {
      return "Invalid file type. Please upload a supported file format.";
    }

    // Validation errors
    if (message.includes("required") || message.includes("missing")) {
      return "Please fill in all required fields.";
    }

    if (message.includes("invalid")) {
      return "Invalid input. Please check your information and try again.";
    }

    // Authentication errors
    if (message.includes("not authenticated") || message.includes("login")) {
      return "Please log in to continue.";
    }

    // Return original message if no pattern matches
    return rawMessage || "An unexpected error occurred. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Retryable errors
    const retryablePatterns = [
      "network",
      "timeout",
      "server error",
      "500",
      "502",
      "503",
      "504",
      "rate limit",
      "429",
      "temporary",
      "unavailable",
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  return false;
}

/**
 * Handle API errors with retry logic
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions & {
    onError?: (error: Error, userMessage: string) => void;
  } = {}
): Promise<T> {
  const { onError, ...retryOptions } = options;

  try {
    if (isRetryableError(new Error("check"))) {
      return await retryWithBackoff(apiCall, retryOptions);
    }
    return await apiCall();
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    
    if (onError) {
      onError(
        error instanceof Error ? error : new Error(String(error)),
        userMessage
      );
    }

    throw error;
  }
}

/**
 * Error boundary helper for React components
 */
export function getErrorDetails(error: unknown): {
  message: string;
  userMessage: string;
  retryable: boolean;
} {
  const userMessage = getUserFriendlyError(error);
  const retryable = isRetryableError(error);
  const message =
    error instanceof Error ? error.message : String(error);

  return {
    message,
    userMessage,
    retryable,
  };
}

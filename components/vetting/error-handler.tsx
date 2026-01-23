"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { getUserFriendlyError, isRetryableError } from "@/lib/error-handling";

interface ErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
}

export function ErrorHandler({
  error,
  onRetry,
  onDismiss,
  title = "Error",
}: ErrorHandlerProps) {
  const [showError, setShowError] = useState(!!error);

  useEffect(() => {
    setShowError(!!error);
  }, [error]);

  if (!error || !showError) {
    return null;
  }

  const userMessage = getUserFriendlyError(error);
  const retryable = isRetryableError(error);

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{userMessage}</p>
        {retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              onRetry();
              setShowError(false);
            }}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 ml-2"
            onClick={() => {
              onDismiss();
              setShowError(false);
            }}
          >
            <X className="h-3 w-3 mr-2" />
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

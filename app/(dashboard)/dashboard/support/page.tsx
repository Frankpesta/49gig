"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormSection } from "@/components/forms/form-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, LifeBuoy, MessageSquare, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export default function SupportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const createSupportChat = useMutation((api as any)["chat/mutations"].createSupportChat);

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={LifeBuoy} title="Please log in" iconTone="muted" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: { subject?: string; message?: string } = {};
    if (!subject.trim()) errors.subject = "Subject is required";
    if (!message.trim()) errors.message = "Message is required";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!user?._id) return;

    setIsSubmitting(true);
    try {
      const chatId = await createSupportChat({
        subject,
        initialMessage: message,
        userId: user._id,
      });
      
      setIsSubmitted(true);
      // Redirect to chat after a moment
      setTimeout(() => {
        router.push(`/dashboard/chat/${chatId}`);
      }, 2000);
    } catch (error) {
      console.error("Failed to create support chat:", error);
      const errorMessage = getUserFriendlyError(error) || "Failed to create support request. Please try again.";
      setErrorDialog({
        open: true,
        title: "Request Failed",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Support Request Created</h3>
              <p className="text-sm text-muted-foreground text-center">
                Your support request has been created. Redirecting to chat...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Help & Support"
        description="Get help from our support team or create a support request."
        icon={LifeBuoy}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Support Request */}
        <Card className="rounded-xl overflow-hidden border-border/60">
          <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Create Support Request
            </CardTitle>
            <CardDescription>
              Submit a support request and our team will respond within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormSection
                title="Request details"
                description="Provide a clear subject and description so we can help you quickly."
              >
                <FormField
                  label="Subject"
                  htmlFor="subject"
                  description="Brief summary of your issue (e.g. Payment not received, Account verification)"
                  error={fieldErrors.subject}
                  required
                >
                  <Input
                    id="subject"
                    placeholder="What do you need help with?"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (fieldErrors.subject) setFieldErrors((p) => ({ ...p, subject: undefined }));
                    }}
                    className={`rounded-lg h-11 ${fieldErrors.subject ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </FormField>
                <FormField
                  label="Message"
                  htmlFor="message"
                  description="Include any relevant details, project IDs, or error messages."
                  error={fieldErrors.message}
                  required
                >
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question in detail..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined }));
                    }}
                    rows={6}
                    className={`rounded-lg min-h-[140px] ${fieldErrors.message ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </FormField>
              </FormSection>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Resources */}
        <Card className="rounded-xl overflow-hidden border-border/60">
          <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Help Resources
            </CardTitle>
            <CardDescription>
              Common questions and resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Getting Started</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>How to create a project</li>
                <li>How to complete verification</li>
                <li>Understanding the matching process</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Payments</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>How payments work</li>
                <li>Milestone approval process</li>
                <li>Payment disputes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Account</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Updating your profile</li>
                <li>Changing password</li>
                <li>Account settings</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Can't find what you're looking for? Create a support request and our team will help you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, HelpCircle, MessageSquare, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export default function SupportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const createSupportChat = useMutation((api as any)["chat/mutations"].createSupportChat);

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={HelpCircle} title="Please log in" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !subject.trim() || !message.trim()) return;

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
      const errorMessage = error instanceof Error ? error.message : "Failed to create support request. Please try again.";
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
    <div className="space-y-6">
      <DashboardPageHeader
        title="Help & Support"
        description="Get help from our support team or create a support request."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Support Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Create Support Request
            </CardTitle>
            <CardDescription>
              Submit a support request and our team will get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What do you need help with?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
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


"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, X, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getBrowserFingerprint, getClientIP } from "@/lib/browser-fingerprint";
import { handleApiCall, getUserFriendlyError } from "@/lib/error-handling";
import { ErrorHandler } from "./error-handler";

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface IdentityUploadProps {
  onComplete?: () => void;
}

export function IdentityUpload({ onComplete }: IdentityUploadProps) {
  const { user } = useAuth();
  const submitIdentity = useMutation(api.vetting.mutations.submitIdentityVerification);
  const generateUploadUrl = useMutation(api.vetting.mutations.generateIdentityUploadUrl);

  const [documentType, setDocumentType] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File must be an image (JPEG, PNG, or WebP)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(new Error(validationError));
      return;
    }

    setDocumentFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(new Error(validationError));
      return;
    }

    setSelfieFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setError(new Error("Failed to access camera. Please allow camera permissions."));
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureSelfie = () => {
    if (!selfieVideoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = selfieVideoRef.current.videoWidth;
    canvas.height = selfieVideoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(selfieVideoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          setSelfieFile(file);
          setSelfiePreview(canvas.toDataURL());
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleSubmit = async () => {
    if (!documentType || !documentNumber || !documentFile || !selfieFile) {
      setError(new Error("Please fill in all fields and upload both documents"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get browser fingerprint and IP
      const [fingerprint, ipAddress] = await Promise.all([
        getBrowserFingerprint(),
        getClientIP(),
      ]);

      setUploadProgress(10);

      // Get upload URLs with retry logic
      const { url: documentUploadUrl } = await handleApiCall(
        () => generateUploadUrl({ userId: user?._id }),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );
      const { url: selfieUploadUrl } = await handleApiCall(
        () => generateUploadUrl({ userId: user?._id }),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );

      setUploadProgress(20);

      // Upload document to Convex storage with retry logic
      const documentStorageId = await handleApiCall(
        async () => {
          const response = await fetch(documentUploadUrl, {
            method: "POST",
            body: documentFile,
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload document: ${errorText}`);
          }
          return (await response.json()) as string;
        },
        {
          maxRetries: 3,
          retryDelay: 2000,
          exponentialBackoff: true,
        }
      );

      setUploadProgress(50);

      // Upload selfie to Convex storage with retry logic
      const selfieStorageId = await handleApiCall(
        async () => {
          const response = await fetch(selfieUploadUrl, {
            method: "POST",
            body: selfieFile,
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload selfie: ${errorText}`);
          }
          return (await response.json()) as string;
        },
        {
          maxRetries: 3,
          retryDelay: 2000,
          exponentialBackoff: true,
        }
      );

      setUploadProgress(70);

      // Submit identity verification with retry logic
      await handleApiCall(
        () =>
          submitIdentity({
            documentImageId: documentStorageId as any,
            selfieImageId: selfieStorageId as any,
            documentType,
            documentNumber,
            provider: "smile_identity",
            browserFingerprint: fingerprint,
            ipAddress,
            userId: user?._id,
          }),
        {
          maxRetries: 2,
          retryDelay: 1000,
        }
      );

      setUploadProgress(100);

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount((prev) => prev + 1);
    if (documentFile && selfieFile) {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Upload your identity document and a selfie for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ErrorHandler
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
          title="Upload Error"
        />

        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="documentType">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentNumber">Document Number *</Label>
          <Input
            id="documentNumber"
            placeholder="Enter document number"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Identity Document *</Label>
            <div className="flex items-center gap-4">
              <Input
                ref={documentInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleDocumentChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => documentInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              {documentFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {documentFile.name}
                </div>
              )}
            </div>
            {documentPreview && (
              <div className="mt-2 relative">
                <img
                  src={documentPreview}
                  alt="Document preview"
                  className="max-w-full h-auto rounded-lg border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Selfie Photo *</Label>
            <div className="flex items-center gap-4">
              <Input
                ref={selfieInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleSelfieChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => selfieInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Selfie
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={showCamera ? stopCamera : startCamera}
              >
                <Camera className="mr-2 h-4 w-4" />
                {showCamera ? "Stop Camera" : "Take Photo"}
              </Button>
              {selfieFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {selfieFile.name}
                </div>
              )}
            </div>
            {showCamera && (
              <div className="mt-2 relative">
                <video
                  ref={selfieVideoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border"
                />
                <Button
                  type="button"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  onClick={captureSelfie}
                >
                  Capture
                </Button>
              </div>
            )}
            {selfiePreview && !showCamera && (
              <div className="mt-2 relative">
                <img
                  src={selfiePreview}
                  alt="Selfie preview"
                  className="max-w-md h-auto rounded-lg border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelfieFile(null);
                    setSelfiePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !documentType || !documentNumber || !documentFile || !selfieFile}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit for Verification"}
        </Button>
      </CardContent>
    </Card>
  );
}

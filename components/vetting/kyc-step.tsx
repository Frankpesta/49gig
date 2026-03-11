"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ID_TYPES = [
  { value: "nin", label: "NIN (National ID)" },
  { value: "international_passport", label: "International Passport" },
  { value: "other", label: "Other government-issued ID" },
] as const;

const ADDRESS_TYPES = [
  { value: "utility_bill", label: "Utility bill" },
  { value: "bank_statement", label: "Bank statement" },
  { value: "tenancy_agreement", label: "Tenancy agreement" },
] as const;

export function KycStep({ userId }: { userId: Id<"users"> }) {
  const kycData = useQuery(api.kyc.queries.getKycForFreelancer, { userId });
  const generateUploadUrl = useMutation(api.kyc.mutations.generateUploadUrl);
  const submitKyc = useMutation(api.kyc.mutations.submitKyc);

  const [idType, setIdType] = useState<string>("nin");
  const [idOtherLabel, setIdOtherLabel] = useState("");
  const [addressDocType, setAddressDocType] = useState<string>("utility_bill");
  const [idFrontFileId, setIdFrontFileId] = useState<Id<"_storage"> | null>(null);
  const [idBackFileId, setIdBackFileId] = useState<Id<"_storage"> | null>(null);
  const [addressFileId, setAddressFileId] = useState<Id<"_storage"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (id: Id<"_storage">) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`${label}: file must be 5MB or less`);
      return;
    }
    setUploading(label);
    try {
      const url = await generateUploadUrl({ userId });
      const res = await fetch(url, { method: "POST", body: file });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      setter(storageId);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(getUserFriendlyError(err) ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!idFrontFileId || !idBackFileId || !addressFileId) {
      toast.error("Please upload all required documents");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitKyc({
        userId,
        idType: idType as "nin" | "international_passport" | "other",
        idOtherLabel: idType === "other" ? idOtherLabel : undefined,
        idFrontFileId,
        idBackFileId,
        addressDocFileId: addressFileId,
        addressDocType: addressDocType as "utility_bill" | "bank_statement" | "tenancy_agreement",
      });
      toast.success("KYC submitted. Review typically takes up to 2 business days.");
      window.location.reload();
    } catch (err) {
      toast.error(getUserFriendlyError(err) ?? "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submission = kycData?.submission;
  const status = kycData?.kycStatus;
  const isPending = status === "pending_review";
  const isRejected = status === "id_rejected" || status === "address_rejected";

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Upload tips
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1 opacity-90">
            <li>Use clear, readable images or PDFs (max 5MB per file).</li>
            <li>Address document must be from the last 3 months.</li>
            <li>Review may take up to 2 business days.</li>
          </ul>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Your documents are under review. We’ll notify you once verified.</span>
          </div>
        )}

        {isRejected && submission && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Verification not approved</p>
            <p className="mt-1 text-muted-foreground">
              {submission.status === "id_rejected"
                ? submission.idRejectionReason
                : submission.addressRejectionReason}{" "}
              Please resubmit below.
            </p>
          </div>
        )}

        {status !== "approved" && !isPending && (
          <>
            <div className="space-y-4">
              <div>
                <Label>ID type</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {idType === "other" && (
                  <Input
                    className="mt-2"
                    placeholder="Specify document type"
                    value={idOtherLabel}
                    onChange={(e) => setIdOtherLabel(e.target.value)}
                  />
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>ID front</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFile(e, setIdFrontFileId, "ID front")}
                      disabled={!!uploading}
                    />
                    {idFrontFileId && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                  {uploading === "ID front" && <p className="text-xs text-muted-foreground">Uploading…</p>}
                </div>
                <div>
                  <Label>ID back</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFile(e, setIdBackFileId, "ID back")}
                      disabled={!!uploading}
                    />
                    {idBackFileId && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                  {uploading === "ID back" && <p className="text-xs text-muted-foreground">Uploading…</p>}
                </div>
              </div>

              <div>
                <Label>Address document type</Label>
                <Select value={addressDocType} onValueChange={setAddressDocType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Address document (utility bill, bank statement, or tenancy agreement — not older than 3 months)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFile(e, setAddressFileId, "Address document")}
                    disabled={!!uploading}
                  />
                  {addressFileId && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
                {uploading === "Address document" && <p className="text-xs text-muted-foreground">Uploading…</p>}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !idFrontFileId || !idBackFileId || !addressFileId}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {submission ? "Resubmit KYC" : "Submit KYC"}
            </Button>
          </>
        )}

        {status === "approved" && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>KYC approved. You can now be matched with projects.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

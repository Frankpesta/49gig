"use client";

import { getFreelancerPhoneRaw } from "@/lib/freelancer-phone";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Ban,
  ArrowLeft,
  Wallet,
  Briefcase,
  Star,
  AlertCircle,
  Clock,
  Activity,
  Building2,
  Globe,
  Link as LinkIcon,
  Award,
  CreditCard,
  Loader2,
  Trash2,
  UserCheck,
  Github,
  Linkedin,
  ExternalLink,
  FileText,
  Download,
  CheckCircle2,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { FreelancerSignupApprovalManageBlock } from "@/components/dashboard/freelancer-signup-approval-manage-block";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import Link from "next/link";

const COUNTRY_CODES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AO: "Angola", AR: "Argentina",
  AU: "Australia", AT: "Austria", AZ: "Azerbaijan", BS: "Bahamas", BH: "Bahrain",
  BD: "Bangladesh", BE: "Belgium", BJ: "Benin", BW: "Botswana", BR: "Brazil",
  BF: "Burkina Faso", BI: "Burundi", CM: "Cameroon", CA: "Canada", CV: "Cape Verde",
  CF: "Central African Republic", TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia",
  KM: "Comoros", CG: "Congo", CD: "DR Congo", CI: "Côte d'Ivoire", HR: "Croatia",
  CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", DJ: "Djibouti", EG: "Egypt",
  GQ: "Equatorial Guinea", ER: "Eritrea", ET: "Ethiopia", FI: "Finland", FR: "France",
  GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana", GR: "Greece",
  GT: "Guatemala", GN: "Guinea", GW: "Guinea-Bissau", GY: "Guyana", HT: "Haiti",
  HN: "Honduras", HU: "Hungary", IN: "India", ID: "Indonesia", IQ: "Iraq", IE: "Ireland",
  IL: "Israel", IT: "Italy", JM: "Jamaica", JP: "Japan", JO: "Jordan", KZ: "Kazakhstan",
  KE: "Kenya", KW: "Kuwait", LB: "Lebanon", LS: "Lesotho", LR: "Liberia", LY: "Libya",
  MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives", ML: "Mali", MT: "Malta",
  MR: "Mauritania", MU: "Mauritius", MX: "Mexico", MA: "Morocco", MZ: "Mozambique",
  NA: "Namibia", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua", NE: "Niger",
  NG: "Nigeria", NO: "Norway", OM: "Oman", PK: "Pakistan", PA: "Panama", PY: "Paraguay",
  PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RW: "Rwanda", SA: "Saudi Arabia", SN: "Senegal", SL: "Sierra Leone", SO: "Somalia",
  ZA: "South Africa", SS: "South Sudan", ES: "Spain", LK: "Sri Lanka", SD: "Sudan",
  SZ: "Eswatini", SE: "Sweden", CH: "Switzerland", SY: "Syria", TZ: "Tanzania",
  TH: "Thailand", TG: "Togo", TT: "Trinidad and Tobago", TN: "Tunisia", TR: "Turkey",
  UG: "Uganda", UA: "Ukraine", AE: "United Arab Emirates", GB: "United Kingdom",
  US: "United States", UY: "Uruguay", UZ: "Uzbekistan", VE: "Venezuela", VN: "Vietnam",
  YE: "Yemen", ZM: "Zambia", ZW: "Zimbabwe",
};

function resolveCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^[A-Z]{2}$/.test(trimmed)) return COUNTRY_CODES[trimmed] ?? trimmed;
  return trimmed;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    approved: "default",
    completed: "default",
    suspended: "destructive",
    deleted: "destructive",
    rejected: "destructive",
    pending_review: "secondary",
    in_progress: "secondary",
    not_started: "outline",
    not_submitted: "outline",
    id_rejected: "destructive",
    address_rejected: "destructive",
    pending: "secondary",
    pending_admin: "secondary",
    flagged: "secondary",
  };
  return (
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/** Login / lifecycle — not freelancer platform vetting */
function AccountStatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="border-border text-muted-foreground"
        title="Account is enabled on the platform (not the same as matching eligibility)"
      >
        Account active
      </Badge>
    );
  }
  return <StatusBadge status={status} />;
}

/** Same rules as vetting/queries.isFreelancerVerified: user doc + vetting row + KYC */
function FreelancerPlatformVerifiedBadge({
  verificationStatus,
  kycStatus,
  vettingResultStatus,
  vettingLoaded,
}: {
  verificationStatus?: string;
  kycStatus?: string;
  vettingResultStatus?: string;
  vettingLoaded: boolean;
}) {
  if (!vettingLoaded) {
    return (
      <Badge variant="outline" className="animate-pulse text-muted-foreground">
        Loading verification…
      </Badge>
    );
  }

  const v = verificationStatus ?? "not_started";
  const kyc = kycStatus ?? "not_submitted";
  const vetting = vettingResultStatus;

  const fullyApproved =
    v === "approved" &&
    kyc === "approved" &&
    vetting === "approved";

  if (fullyApproved) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/50 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200"
        title="Approved by admin — tests passed, KYC cleared (matching eligibility)"
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Verified
      </Badge>
    );
  }

  if (v === "rejected" || vetting === "rejected") {
    return (
      <Badge variant="destructive" className="gap-1" title="Not eligible for matching">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        Verification failed
      </Badge>
    );
  }

  if (vetting !== "approved") {
    const label =
      vetting === "pending_review"
        ? "Tests pending admin"
        : vetting === "pending_admin"
          ? "Tests awaiting admin"
        : vetting === "pending"
          ? "Tests pending start"
        : vetting === "flagged"
          ? "Assessment flagged"
        : vetting === "in_progress"
          ? "Tests in progress"
          : vetting != null
            ? `Assessment: ${String(vetting).replace(/_/g, " ")}`
            : "Assessment not finished";
    return (
      <Badge variant="secondary" className="max-w-56 text-left font-normal" title={label}>
        {label}
      </Badge>
    );
  }

  if (v === "approved" && kyc !== "approved") {
    const label =
      kyc === "pending_review"
        ? "KYC in review"
        : kyc === "not_submitted"
          ? "KYC required"
          : `KYC: ${kyc.replace(/_/g, " ")}`;
    return (
      <Badge variant="secondary" className="font-normal" title={label}>
        {label}
      </Badge>
    );
  }

  const label =
    v === "in_progress"
      ? "Verification in progress"
      : v === "pending_review"
        ? "Profile pending admin"
        : `Status: ${v.replace(/_/g, " ")}`;
  return (
    <Badge variant="outline" className="font-normal" title={label}>
      {label}
    </Badge>
  );
}

function isFreelancerMatchingGateCleared(
  profileData: Doc<"users">,
  vettingLoaded: boolean,
  vettingResultStatus?: string | null
): boolean | null {
  if (profileData.role !== "freelancer") return null;
  if (!vettingLoaded) return null;
  return (
    profileData.verificationStatus === "approved" &&
    profileData.kycStatus === "approved" &&
    vettingResultStatus === "approved"
  );
}

function InfoRow({ label, value, icon: Icon, truncate }: { label: string; value?: string | null; icon?: React.ComponentType<{ className?: string }>; truncate?: boolean }) {
  if (!value) return null;
  const displayValue = truncate && value.length > 16
    ? `${value.slice(0, 8)}...${value.slice(-4)}`
    : value;
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-medium text-foreground break-all font-mono">{displayValue}</p>
          {truncate && (
            <button
              type="button"
              title="Copy full ID"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { navigator.clipboard.writeText(value); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminProfileLinkRow({
  label,
  url,
  icon: Icon,
}: {
  label: string;
  url?: string | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const trimmed = url?.trim();
  if (!trimmed) {
    return (
      <div className="flex items-start gap-3 py-2.5">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Not set</p>
        </div>
      </div>
    );
  }
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline break-all"
        >
          {trimmed}
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </a>
      </div>
    </div>
  );
}

function KycDocLink({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm text-muted-foreground italic">Not submitted</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Download className="h-4 w-4" />
        Download document
      </a>
    </div>
  );
}

function ScoreBar({ label, score, max = 100 }: { label: string; score?: number | null; max?: number }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{score}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("permanent");
  const [isActioning, setIsActioning] = useState(false);

  const [reviewDeleteId, setReviewDeleteId] = useState<Id<"reviews"> | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  const [kycModalOpen, setKycModalOpen] = useState(false);

  const [freelancerSkillsInput, setFreelancerSkillsInput] = useState("");
  const [freelancerExperienceLevel, setFreelancerExperienceLevel] = useState<
    "junior" | "mid" | "senior" | "expert"
  >("junior");
  const [freelancerTechField, setFreelancerTechField] = useState<string>("other");
  const [isSavingFreelancerProfile, setIsSavingFreelancerProfile] = useState(false);

  const [verificationOverrideOpen, setVerificationOverrideOpen] = useState(false);
  const [verificationOverrideReason, setVerificationOverrideReason] = useState("");
  const [verificationOverrideApproveKyc, setVerificationOverrideApproveKyc] = useState(true);
  const [verificationOverrideLoading, setVerificationOverrideLoading] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReviewNotes, setRejectReviewNotes] = useState("");
  const [vettingActionLoading, setVettingActionLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const profileData = useQuery(
    api.users.queries.getUserProfileForAdmin,
    isAuthenticated && currentUser?._id && (currentUser.role === "admin" || currentUser.role === "moderator")
      ? { targetUserId: userId as Id<"users">, adminUserId: currentUser._id }
      : "skip"
  );

  const isStaffViewer = currentUser?.role === "admin" || currentUser?.role === "moderator";
  const isModeratorViewer = currentUser?.role === "moderator";

  const walletStats = useQuery(
    api.wallets.queries.getWalletStats,
    isAuthenticated && currentUser?._id && !isModeratorViewer
      ? { userId: userId as Id<"users"> }
      : "skip"
  );

  // Only fetch vetting data when the target user is confirmed to be a freelancer
  const vettingData = useQuery(
    api.vetting.queries.getVerificationResults,
    isAuthenticated &&
      currentUser?._id &&
      (currentUser.role === "admin" || currentUser.role === "moderator") &&
      profileData?.role === "freelancer"
      ? { freelancerId: userId as Id<"users">, adminUserId: currentUser._id }
      : "skip"
  );

  const freelancerReviewsForStaff = useQuery(
    (api as any)["reviews/queries"].getReviewsForFreelancer,
    isAuthenticated &&
      currentUser?._id &&
      (currentUser.role === "admin" || currentUser.role === "moderator") &&
      profileData?.role === "freelancer"
      ? {
          freelancerId: userId as Id<"users">,
          userId: currentUser._id,
          limit: 50,
        }
      : "skip"
  );

  const freelancerRatingStatsForStaff = useQuery(
    (api as any)["reviews/queries"].getFreelancerRatingStats,
    isAuthenticated &&
      currentUser?._id &&
      (currentUser.role === "admin" || currentUser.role === "moderator") &&
      profileData?.role === "freelancer"
      ? {
          freelancerId: userId as Id<"users">,
          viewerUserId: currentUser._id,
        }
      : "skip"
  );

  const kycData = useQuery(
    api.kyc.queries.getKycByFreelancerId,
    kycModalOpen &&
      isAuthenticated &&
      currentUser?._id &&
      currentUser.role === "admin" &&
      profileData?.role === "freelancer" &&
      profileData.kycStatus === "approved"
      ? { freelancerId: userId as Id<"users">, reviewerUserId: currentUser._id }
      : "skip"
  );

  const updateUserRole = useMutation(api.users.mutations.updateUserRole);
  const updateUserStatus = useMutation(api.users.mutations.updateUserStatus);
  const adminDeleteFreelancerReview = useMutation(api.reviews.mutations.adminDeleteFreelancerReview);
  const updateFreelancerProfileByAdmin = useMutation(
    (api as any).users.mutations.updateFreelancerProfileByAdmin
  );
  const adminOverrideVerification = useMutation(
    api.vetting.mutations.adminOverrideFreelancerVerificationAndTests
  );
  const approveVerification = useMutation(api.vetting.mutations.approveVerification);
  const rejectVerification = useMutation(api.vetting.mutations.rejectVerification);

  const resolvedCountry = useMemo(
    () => resolveCountry(profileData?.profile?.country),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileData?.profile?.country]
  );

  useEffect(() => {
    if (profileData?.role === "freelancer") {
      setFreelancerTechField((profileData.profile?.techField as string) ?? "other");
      setFreelancerExperienceLevel(
        (profileData.profile?.experienceLevel as "junior" | "mid" | "senior" | "expert") ?? "junior"
      );
      setFreelancerSkillsInput((profileData.profile?.skills ?? []).join(", "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData?._id]);

  if (!isAuthenticated || !currentUser) {
    return <DashboardEmptyState icon={User} title="Please log in" iconTone="muted" />;
  }

  if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Shield}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can view user details."
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  if (profileData === undefined) {
    return <DashboardLoadingState label="Loading user details" />;
  }

  if (!profileData) {
    return (
      <DashboardEmptyState
        icon={User}
        iconTone="muted"
        title="User not found"
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  const isFreelancer = profileData.role === "freelancer";
  const isClient = profileData.role === "client";
  const initials = profileData.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const lastSessionIp = (profileData as any)._lastSessionIp as string | null | undefined;
  const countryDisplay = resolvedCountry ?? (lastSessionIp ? `IP: ${lastSessionIp}` : "Not provided");
  const matchingGateCleared = isFreelancerMatchingGateCleared(
    profileData,
    vettingData !== undefined,
    vettingData?.vettingResult?.status
  );

  const handleRoleUpdate = async () => {
    if (!newRole || !currentUser?._id) return;
    setIsActioning(true);
    try {
      await updateUserRole({
        userId: profileData._id,
        newRole: newRole as "client" | "freelancer" | "moderator" | "admin",
        adminUserId: currentUser._id,
      });
      toast.success("Role updated successfully");
      setRoleDialogOpen(false);
      setNewRole("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to update role");
    } finally {
      setIsActioning(false);
    }
  };

  const getSuspendedUntil = (duration: string): number | undefined => {
    const now = Date.now();
    const map: Record<string, number> = {
      "1week": 7 * 24 * 60 * 60 * 1000,
      "2weeks": 14 * 24 * 60 * 60 * 1000,
      "1month": 30 * 24 * 60 * 60 * 1000,
      "3months": 90 * 24 * 60 * 60 * 1000,
      "6months": 180 * 24 * 60 * 60 * 1000,
      "1year": 365 * 24 * 60 * 60 * 1000,
    };
    return map[duration] ? now + map[duration] : undefined;
  };

  const handleSuspend = async () => {
    if (!currentUser?._id) return;
    setIsActioning(true);
    try {
      await updateUserStatus({
        userId: profileData._id,
        newStatus: "suspended",
        adminUserId: currentUser._id,
        suspensionReason: suspendReason.trim() || undefined,
        suspendedUntil: getSuspendedUntil(suspendDuration),
      });
      toast.success("User suspended");
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setSuspendDuration("permanent");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to suspend user");
    } finally {
      setIsActioning(false);
    }
  };

  const handleReactivate = async () => {
    if (!currentUser?._id) return;
    setIsActioning(true);
    try {
      await updateUserStatus({
        userId: profileData._id,
        newStatus: "active",
        adminUserId: currentUser._id,
      });
      toast.success("User reactivated");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to reactivate user");
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmDeleteReview = async () => {
    if (!reviewDeleteId || !currentUser?._id || currentUser.role !== "admin") return;
    setIsDeletingReview(true);
    try {
      await adminDeleteFreelancerReview({
        reviewId: reviewDeleteId,
        userId: currentUser._id,
      });
      toast.success("Review removed from this freelancer’s record.");
      setReviewDeleteId(null);
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not delete review");
    } finally {
      setIsDeletingReview(false);
    }
  };

  const handleFreelancerProfileUpdate = async () => {
    if (!currentUser?._id || profileData.role !== "freelancer") return;
    const skills = freelancerSkillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSavingFreelancerProfile(true);
    try {
      await updateFreelancerProfileByAdmin({
        targetUserId: profileData._id,
        adminUserId: currentUser._id,
        experienceLevel: freelancerExperienceLevel,
        techField: freelancerTechField as any,
        skills,
      });
      toast.success("Freelancer profile updated.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not update freelancer profile.");
    } finally {
      setIsSavingFreelancerProfile(false);
    }
  };

  const handleAdminVerificationOverride = async () => {
    if (!currentUser?._id || profileData.role !== "freelancer") return;
    setVerificationOverrideLoading(true);
    try {
      await adminOverrideVerification({
        freelancerId: profileData._id,
        adminUserId: currentUser._id,
        reason: verificationOverrideReason.trim() || undefined,
        approveKyc: verificationOverrideApproveKyc,
      });
      toast.success("Verification and tests overridden for this freelancer.");
      setVerificationOverrideOpen(false);
      setVerificationOverrideReason("");
      setVerificationOverrideApproveKyc(true);
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Override failed");
    } finally {
      setVerificationOverrideLoading(false);
    }
  };

  const handleApproveFreelancerVetting = async () => {
    if (!currentUser?._id) return;
    setVettingActionLoading(true);
    try {
      await approveVerification({
        freelancerId: profileData._id,
        adminUserId: currentUser._id,
      });
      toast.success("Freelancer verification approved.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not approve verification.");
    } finally {
      setVettingActionLoading(false);
    }
  };

  const handleRejectFreelancerVetting = async () => {
    if (!currentUser?._id) return;
    const notes = rejectReviewNotes.trim();
    if (!notes) {
      toast.error("Add review notes explaining the rejection.");
      return;
    }
    setVettingActionLoading(true);
    try {
      await rejectVerification({
        freelancerId: profileData._id,
        reviewNotes: notes,
        adminUserId: currentUser._id,
      });
      toast.success("Verification rejected — account deleted.");
      setRejectDialogOpen(false);
      setRejectReviewNotes("");
      router.push("/dashboard/users");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not reject verification.");
    } finally {
      setVettingActionLoading(false);
    }
  };

  const handleAdminDeleteAccount = async () => {
    if (!currentUser?._id || currentUser.role !== "admin") return;
    setDeleteAccountLoading(true);
    try {
      await updateUserStatus({
        userId: profileData._id,
        newStatus: "deleted",
        adminUserId: currentUser._id,
      });
      toast.success("Account permanently deleted.");
      setDeleteDialogOpen(false);
      router.push("/dashboard/users");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not delete this account.");
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const canFinalApprove =
    currentUser.role === "admin" &&
    !!vettingData?.vettingResult &&
    (vettingData.vettingResult.status === "pending_admin" || vettingData.vettingResult.status === "flagged") &&
    profileData.verificationStatus === "pending_review";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            if (isModeratorViewer) {
              router.push("/dashboard");
              return;
            }
            // Prefer browser back so the list page restores its exact
            // search/filter/page state from the URL instead of resetting.
            if (typeof window !== "undefined" && window.history.length > 2) {
              router.back();
            } else {
              router.push("/dashboard/users");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DashboardPageHeader
          title="User Details"
          description={
            isModeratorViewer
              ? `Profile overview for ${profileData.name} (financial details hidden)`
              : `Full profile and admin actions for ${profileData.name}`
          }
          icon={User}
          className="flex-1"
        />
      </div>

      {isFreelancer && currentUser.role === "admin" && currentUser._id && (
        <FreelancerSignupApprovalManageBlock
          freelancerId={profileData._id}
          adminUserId={currentUser._id}
          enabled
          onAfterAction={() => {}}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Identity card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="pt-6 flex flex-col items-center gap-4 pb-6">
              <Avatar className="h-24 w-24 ring-4 ring-border/60">
                <AvatarImage src={profileData.profile?.imageUrl} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1.5">
                <h2 className="text-xl font-bold">{profileData.name}</h2>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Badge variant="outline" className="capitalize">{profileData.role}</Badge>
                  <AccountStatusBadge status={profileData.status} />
                  {profileData.emailVerified && (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground border-border"
                      title="Login email has been confirmed — not the same as freelancer platform verification"
                    >
                      <Mail className="h-3 w-3 mr-1 shrink-0" />
                      Email verified
                    </Badge>
                  )}
                  {isFreelancer && (
                    <FreelancerPlatformVerifiedBadge
                      verificationStatus={profileData.verificationStatus}
                      kycStatus={profileData.kycStatus}
                      vettingResultStatus={vettingData?.vettingResult?.status}
                      vettingLoaded={vettingData !== undefined}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick ID info */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border/40">
              <InfoRow label="User ID" value={profileData._id} icon={Shield} truncate />
              <InfoRow label="Phone" value={profileData.profile?.phoneNumber} icon={Phone} />
              <InfoRow label="Address" value={(profileData.profile as any)?.address} icon={MapPin} />
              <InfoRow
                label="Country"
                value={countryDisplay}
                icon={Globe}
              />
              <InfoRow
                label="Date Joined"
                value={format(profileData.createdAt, "PPP")}
                icon={Calendar}
              />
              <InfoRow
                label="Last Login"
                value={profileData.lastLoginAt ? formatDistanceToNow(profileData.lastLoginAt, { addSuffix: true }) : "Never"}
                icon={Clock}
              />
              <InfoRow
                label="Auth Provider"
                value={profileData.authProvider}
                icon={Shield}
              />
              {profileData.suspendedAt && (
                <InfoRow
                  label="Suspended"
                  value={format(profileData.suspendedAt, "PPP")}
                  icon={Ban}
                />
              )}
              {profileData.suspensionReason && (
                <InfoRow label="Suspension Reason" value={profileData.suspensionReason} icon={AlertCircle} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Admin Actions (moderators: navigation only; no role/suspend) */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {isModeratorViewer ? "Actions" : "Admin Actions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {currentUser.role === "admin" ? (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setNewRole(profileData.role); setRoleDialogOpen(true); }}>
                    <Shield className="h-3.5 w-3.5" />
                    Change Role
                  </Button>
                  {profileData.status === "active" ? (
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setSuspendDialogOpen(true)}>
                      <Ban className="h-3.5 w-3.5" />
                      Suspend
                    </Button>
                  ) : profileData.status === "suspended" ? (
                    <Button size="sm" variant="default" className="gap-1.5" onClick={handleReactivate} disabled={isActioning}>
                      {isActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                      Reactivate
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <Link href={`/dashboard/users/${profileData._id}/projects`}>
                  <Briefcase className="h-3.5 w-3.5" />
                  View Projects
                </Link>
              </Button>
              {isFreelancer && currentUser.role === "admin" && (
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <Link href={`/dashboard/users/${profileData._id}/kyc`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    KYC Review
                  </Link>
                </Button>
              )}
              {isFreelancer && currentUser.role === "admin" && profileData.kycStatus === "approved" && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setKycModalOpen(true)}>
                  <FileText className="h-3.5 w-3.5" />
                  View KYC Details
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Delete account — admin only, destructive */}
          {currentUser.role === "admin" && profileData._id !== currentUser._id && profileData.status !== "deleted" && (
            <Card className="rounded-xl overflow-hidden border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Permanently removes the user document and purges their sessions, vetting, wallet (must be
                  zero), notifications, and other user-owned data. Blocked if they are a client on any project,
                  tied to an active hire, have open disputes, or pending referral payouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isActioning || deleteAccountLoading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account…
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Wallet Stats — admin only; hidden from moderators */}
          {currentUser.role === "admin" ? (
            <Card className="rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  {isFreelancer ? "Earnings" : "Wallet"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletStats === undefined ? (
                  <div className="text-sm text-muted-foreground">Loading wallet…</div>
                ) : !walletStats ? (
                  <div className="text-sm text-muted-foreground">No wallet found.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-lg font-bold">${((walletStats.availableCents ?? 0) / 100).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold">${((walletStats.pendingCents ?? 0) / 100).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Total {isFreelancer ? "Earned" : "Paid Out"}</p>
                      <p className="text-lg font-bold">${((walletStats.withdrawnCents ?? 0) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Role-specific profile */}
          {isFreelancer && (
            <>
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Freelancer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <InfoRow label="Primary Role" value={profileData.profile?.primaryRole} icon={Briefcase} />
                  <InfoRow label="Experience Level" value={profileData.profile?.experienceLevel} icon={Award} />
                  <InfoRow label="Tech Field" value={profileData.profile?.techField?.replace(/_/g, " ")} icon={Activity} />
                  <InfoRow label="Phone Number" value={profileData.profile?.phoneNumber} icon={Phone} />
                  <InfoRow label="Address" value={(profileData.profile as any)?.address} icon={MapPin} />
                  {!isModeratorViewer ? (
                    <InfoRow label="Hourly Rate" value={profileData.profile?.hourlyRate ? `$${profileData.profile.hourlyRate}/hr` : null} icon={CreditCard} />
                  ) : null}
                  <InfoRow label="Timezone" value={profileData.profile?.timezone} icon={Globe} />
                  <InfoRow label="Availability" value={profileData.profile?.availability} icon={Clock} />
                  {profileData.profile?.skills && profileData.profile.skills.length > 0 && (
                    <div className="py-2.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.profile.skills.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.profile?.bio && (
                    <div className="py-2.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                      <p className="text-sm text-foreground leading-relaxed">{profileData.profile.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {currentUser.role === "admin" && (
                <Card className="rounded-xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Edit Freelancer Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Tech field</Label>
                      <Select
                        value={freelancerTechField}
                        onValueChange={setFreelancerTechField}
                        disabled={isSavingFreelancerProfile}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="data_science">Data Science</SelectItem>
                          <SelectItem value="technical_writing">Technical Writing</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="software_development">Software Development</SelectItem>
                          <SelectItem value="ui_ux_design">UI/UX Design</SelectItem>
                          <SelectItem value="data_analytics">Data Analytics</SelectItem>
                          <SelectItem value="devops_cloud">DevOps/Cloud</SelectItem>
                          <SelectItem value="cybersecurity_it">Cybersecurity/IT</SelectItem>
                          <SelectItem value="ai">AI</SelectItem>
                          <SelectItem value="machine_learning">Machine Learning</SelectItem>
                          <SelectItem value="blockchain">Blockchain</SelectItem>
                          <SelectItem value="qa_testing">QA Testing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Experience level</Label>
                      <Select
                        value={freelancerExperienceLevel}
                        onValueChange={(value) =>
                          setFreelancerExperienceLevel(value as "junior" | "mid" | "senior" | "expert")
                        }
                        disabled={isSavingFreelancerProfile}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Skills (comma-separated)</Label>
                      <Input
                        value={freelancerSkillsInput}
                        onChange={(e) => setFreelancerSkillsInput(e.target.value)}
                        placeholder="React, Node.js, PostgreSQL"
                        disabled={isSavingFreelancerProfile}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleFreelancerProfileUpdate()}
                      disabled={isSavingFreelancerProfile}
                    >
                      {isSavingFreelancerProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save freelancer profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Matching profile links
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Same URLs used for client matching eligibility (GitHub / Behance / LinkedIn / site).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <div className="flex items-start gap-3 py-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {getFreelancerPhoneRaw({
                          phoneE164: profileData.phoneE164,
                          profile: profileData.profile,
                        }) || (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <AdminProfileLinkRow
                    label="GitHub"
                    url={profileData.profile?.githubUrl}
                    icon={Github}
                  />
                  <AdminProfileLinkRow
                    label="Behance"
                    url={profileData.profile?.behanceUrl}
                    icon={LinkIcon}
                  />
                  <AdminProfileLinkRow
                    label="LinkedIn"
                    url={profileData.profile?.linkedinUrl}
                    icon={Linkedin}
                  />
                  <AdminProfileLinkRow
                    label="Portfolio / website"
                    url={profileData.profile?.portfolioUrl}
                    icon={Globe}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Client ratings
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Client ratings (staff view). Admins can remove a rating so it no longer affects matching.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {freelancerRatingStatsForStaff === undefined ||
                  freelancerReviewsForStaff === undefined ? (
                    <div className="text-sm text-muted-foreground">Loading reviews…</div>
                  ) : (
                    <>
                      {freelancerRatingStatsForStaff &&
                        freelancerRatingStatsForStaff.count > 0 && (
                          <div className="rounded-lg bg-muted/30 px-4 py-3">
                            <p className="text-xs text-muted-foreground">Aggregate</p>
                            <p className="text-lg font-bold tabular-nums">
                              {freelancerRatingStatsForStaff.averageRating.toFixed(1)}/5 average
                              <span className="text-sm font-medium text-muted-foreground ml-2">
                                ({freelancerRatingStatsForStaff.count}{" "}
                                {freelancerRatingStatsForStaff.count === 1 ? "rating" : "ratings"})
                              </span>
                            </p>
                          </div>
                        )}
                      {!freelancerReviewsForStaff?.length ? (
                        <p className="text-sm text-muted-foreground">
                          No ratings recorded for this freelancer yet.
                        </p>
                      ) : (
                        <ul className="space-y-3 divide-y divide-border/40">
                          {freelancerReviewsForStaff.map((r: Doc<"reviews">) => (
                            <li key={String(r._id)} className="pt-3 first:pt-0">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold tabular-nums">
                                  {r.rating}/5
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                                  </span>
                                  {currentUser.role === "admin" ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-destructive hover:text-destructive"
                                      onClick={() => setReviewDeleteId(r._id)}
                                    >
                                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                                      Remove
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                              {r.comment ? (
                                <p className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap wrap-break-word">
                                  {r.comment}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                <Link
                                  href={`/dashboard/projects/${r.projectId}`}
                                  className="text-primary font-medium hover:underline"
                                >
                                  View hire
                                </Link>
                                <Link
                                  href={`/dashboard/users/${r.clientId}`}
                                  className="text-muted-foreground hover:text-foreground hover:underline"
                                >
                                  Client record
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Verification & Test Scores */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Verification & Test Scores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Vetting (tests)</p>
                      {vettingData === undefined ? (
                        <span className="text-sm text-muted-foreground">Loading…</span>
                      ) : vettingData.vettingResult ? (
                        <StatusBadge status={vettingData.vettingResult.status} />
                      ) : (
                        <span className="text-sm text-muted-foreground">No test record</span>
                      )}
                    </div>
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">KYC status</p>
                      <StatusBadge status={profileData.kycStatus ?? "not_submitted"} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Admin profile approval</p>
                    <StatusBadge status={profileData.verificationStatus ?? "not_started"} />
                  </div>
                  {matchingGateCleared === true && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Fully cleared for matching (tests + KYC + admin approval).
                    </p>
                  )}
                  {matchingGateCleared === false && (
                    <p className="text-xs text-muted-foreground">
                      Matching requires vetting approved, KYC approved, and admin profile approval — one or more steps are still pending.
                    </p>
                  )}

                  {vettingData?.vettingResult && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment Scores</p>
                      <ScoreBar
                        label="Overall Score"
                        score={vettingData.vettingResult.overallScore}
                        max={100}
                      />
                      {vettingData.vettingResult.englishProficiency && (
                        <ScoreBar
                          label="English Proficiency"
                          score={vettingData.vettingResult.englishProficiency.overallScore ?? 0}
                          max={100}
                        />
                      )}
                      {vettingData.vettingResult.skillAssessments?.map((sa: { skillName: string; score: number; maxScore?: number }, i: number) => (
                        <ScoreBar
                          key={i}
                          label={sa.skillName}
                          score={sa.score}
                          max={sa.maxScore ?? 100}
                        />
                      ))}
                    </div>
                  )}

                  {canFinalApprove && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        disabled={vettingActionLoading}
                        onClick={() => void handleApproveFreelancerVetting()}
                      >
                        {vettingActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Final approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={vettingActionLoading}
                        onClick={() => {
                          setRejectReviewNotes("");
                          setRejectDialogOpen(true);
                        }}
                      >
                        Reject verification…
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {currentUser.role === "admin" && (
                <Card className="rounded-xl overflow-hidden border-amber-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <ShieldCheck className="h-4 w-4" />
                      Admin: Override Verification &amp; Tests
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Waives English and skill verification requirements, closes any in-progress skill sessions,
                      and marks vetting as approved. Use when you have verified this person outside the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-amber-600/50 text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
                      onClick={() => setVerificationOverrideOpen(true)}
                    >
                      Override verification &amp; tests…
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {isClient && (
            <Card className="rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Client Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y divide-border/40">
                <InfoRow label="Company" value={profileData.profile?.companyName} icon={Building2} />
                <InfoRow label="Industry" value={profileData.profile?.industry} icon={Briefcase} />
                <InfoRow label="Company Size" value={profileData.profile?.companySize} icon={User} />
                <InfoRow label="Work Email" value={profileData.profile?.workEmail} icon={Mail} />
                <InfoRow label="Website" value={profileData.profile?.companyWebsite} icon={Globe} />
                <InfoRow label="Country" value={resolvedCountry ?? (lastSessionIp ? `IP: ${lastSessionIp}` : undefined)} icon={MapPin} />
              </CardContent>
            </Card>
          )}

          {/* Account details */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border/40">
              <InfoRow label="Referral Code" value={profileData.referralCode} icon={Star} />
              <InfoRow
                label="Email Notifications"
                value={profileData.notificationPreferences?.email ? "Enabled" : "Disabled"}
                icon={Mail}
              />
              <InfoRow
                label="Role Last Changed"
                value={profileData.roleChangedAt ? formatDistanceToNow(profileData.roleChangedAt, { addSuffix: true }) : null}
                icon={Shield}
              />
              <InfoRow
                label="Last Updated"
                value={formatDistanceToNow(profileData.updatedAt, { addSuffix: true })}
                icon={Activity}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role change dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user role</AlertDialogTitle>
            <AlertDialogDescription>
              Update the role for <strong>{profileData.name}</strong>. This takes effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>New role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleUpdate} disabled={isActioning || !newRole}>
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={(open) => {
        setSuspendDialogOpen(open);
        if (!open) { setSuspendReason(""); setSuspendDuration("permanent"); }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend user</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent <strong>{profileData.name}</strong> from logging in. Provide a reason for the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Suspension duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 week</SelectItem>
                  <SelectItem value="2weeks">2 weeks</SelectItem>
                  <SelectItem value="1month">1 month</SelectItem>
                  <SelectItem value="3months">3 months</SelectItem>
                  <SelectItem value="6months">6 months</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="e.g. Policy violation, fraud, etc."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={isActioning} className="bg-destructive hover:bg-destructive/90">
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Suspend user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KYC details modal */}
      <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details</DialogTitle>
            <DialogDescription>
              Identity and address verification for {profileData.name}
            </DialogDescription>
          </DialogHeader>

          {kycData === undefined ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading KYC details…
            </div>
          ) : !kycData ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No KYC submission found.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={kycData.status} />
                </div>
                <div className="rounded-lg bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-sm font-medium">
                    {profileData.kycApprovedAt ? format(profileData.kycApprovedAt, "PPP") : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Identity document
                  {kycData.idType ? (
                    <span className="normal-case font-normal"> — {kycData.idType.replace(/_/g, " ")}</span>
                  ) : null}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycDocLink url={kycData.idFrontUrl} label="ID — Front" />
                  <KycDocLink url={kycData.idBackUrl} label="ID — Back" />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Proof of address
                  {kycData.addressDocType ? (
                    <span className="normal-case font-normal"> — {kycData.addressDocType.replace(/_/g, " ")}</span>
                  ) : null}
                </p>
                <KycDocLink url={kycData.addressUrl} label="Address Document" />
              </div>

              <div className="space-y-0 divide-y divide-border/40">
                <InfoRow
                  label="Submitted"
                  value={kycData.submittedAt ? format(kycData.submittedAt, "PPP 'at' p") : null}
                  icon={Clock}
                />
                <InfoRow
                  label="Reviewed"
                  value={kycData.reviewedAt ? format(kycData.reviewedAt, "PPP 'at' p") : null}
                  icon={Calendar}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={reviewDeleteId != null} onOpenChange={(open) => !open && setReviewDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this rating?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be permanently deleted and will no longer affect this freelancer’s average score or matching
              eligibility.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingReview}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingReview}
              onClick={() => void handleConfirmDeleteReview()}
            >
              {isDeletingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove rating
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin override verification dialog */}
      <Dialog
        open={verificationOverrideOpen}
        onOpenChange={(open) => {
          setVerificationOverrideOpen(open);
          if (!open) {
            setVerificationOverrideReason("");
            setVerificationOverrideApproveKyc(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Override verification &amp; tests?</DialogTitle>
            <DialogDescription>
              This immediately approves vetting and skill tests for{" "}
              <span className="font-medium text-foreground">{profileData.name}</span>. It is recorded in audit
              logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 space-y-0">
              <Checkbox
                id="approve-kyc-override"
                checked={verificationOverrideApproveKyc}
                onCheckedChange={(c) => setVerificationOverrideApproveKyc(c === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="approve-kyc-override"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Also approve KYC
                </label>
                <p className="text-xs text-muted-foreground">
                  Required for matching if identity checks are normally mandatory. Uncheck if only tests should be
                  waived.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="override-reason">Notes (optional)</Label>
              <Textarea
                id="override-reason"
                placeholder="e.g. Vetted via partner program, manual interview completed…"
                value={verificationOverrideReason}
                onChange={(e) => setVerificationOverrideReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerificationOverrideOpen(false)}
              disabled={verificationOverrideLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => void handleAdminVerificationOverride()}
              disabled={verificationOverrideLoading}
            >
              {verificationOverrideLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Confirm override"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject verification dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectReviewNotes("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Reject verification — this permanently deletes the account
            </DialogTitle>
            <DialogDescription>
              Rejecting a freelancer at this stage permanently erases their account: profile, test results, KYC
              documents, messages, and all related records. This cannot be undone — there is no separate
              soft-reject. The freelancer will be emailed and must sign up again from scratch to reapply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-notes">Review notes (required)</Label>
            <Textarea
              id="reject-notes"
              placeholder="Explain what failed or what they should fix"
              value={rejectReviewNotes}
              onChange={(e) => setRejectReviewNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Recorded for audit purposes only — the account is deleted, so the freelancer won&apos;t see these
              notes in-app.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={vettingActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRejectFreelancerVetting()}
              disabled={vettingActionLoading}
            >
              {vettingActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject & delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete account confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete this account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This permanently deletes{" "}
                  <span className="font-medium text-foreground">{profileData.name}</span> ({profileData.email})
                  from the database, including related records (sessions, vetting, notifications, etc.). This
                  cannot be undone.
                </p>
                <p>
                  It will fail if they own any client projects, are on an active hire or escrow flow, have open
                  disputes, a non-zero wallet, or pending referral payout requests.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccountLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleAdminDeleteAccount()}
              disabled={deleteAccountLoading}
            >
              {deleteAccountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

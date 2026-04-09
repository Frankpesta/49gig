"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  XCircle,
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
  UserCheck,
  Github,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import Link from "next/link";

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
  };
  return (
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
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

  const updateUserRole = useMutation(api.users.mutations.updateUserRole);
  const updateUserStatus = useMutation(api.users.mutations.updateUserStatus);

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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={isModeratorViewer ? "/dashboard" : "/dashboard/users"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
                  <StatusBadge status={profileData.status} />
                  {profileData.emailVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
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
                value={profileData.profile?.country}
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
            </CardContent>
          </Card>

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
                        SMS phone verified
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {profileData.phoneVerifiedAt != null ? (
                          <span className="text-green-600 dark:text-green-400">Verified</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Not verified</span>
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
                      <p className="text-xs text-muted-foreground">Verification</p>
                      <StatusBadge status={profileData.verificationStatus ?? "not_started"} />
                    </div>
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">KYC Status</p>
                      <StatusBadge status={profileData.kycStatus ?? "not_submitted"} />
                    </div>
                  </div>

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
                </CardContent>
              </Card>
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
                <InfoRow label="Country" value={profileData.profile?.country} icon={MapPin} />
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
    </div>
  );
}

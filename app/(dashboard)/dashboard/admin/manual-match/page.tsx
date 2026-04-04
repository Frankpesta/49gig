"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  UserSearch,
  Briefcase,
  CheckCircle2,
  Star,
  AlertCircle,
  ChevronRight,
  Users,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

/** Open role labels from server (accepted-match basis); fallback to project.rolesAwaitingMatch. */
function teamRoleOptionsForManualMatch(p: any): string[] {
  const fromServer = (p.manualMatchOpenTeamRoles as string[] | undefined) ?? [];
  if (fromServer.length > 0) return fromServer;
  return (p.rolesAwaitingMatch as string[] | undefined) ?? [];
}

export default function AdminManualMatchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [projectSearch, setProjectSearch] = useState("");
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("any");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  /** Team hire: which open role this manual candidate fills (must align with rolesAwaitingMatch when set). */
  const [teamRoleForMatch, setTeamRoleForMatch] = useState("");

  const adminManualMatch = useMutation(api.matching.mutations.adminManualMatch);

  const allProjects = useQuery(
    api.projects.queries.listManualMatchProjectsAdmin,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  // Fetch all active freelancers
  const allFreelancers = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id
      ? { role: "freelancer", status: "active", userId: user._id }
      : "skip"
  );

  const matchableProjects = useMemo(() => {
    if (!allProjects) return [];
    return (allProjects as any[]).filter((p: any) => {
      if (projectSearch) {
        const q = projectSearch.toLowerCase();
        const title = (p.intakeForm?.title ?? "").toLowerCase();
        if (!title.includes(q)) return false;
      }
      return true;
    });
  }, [allProjects, projectSearch]);

  useEffect(() => {
    if (!selectedProjectId || !allProjects) {
      setTeamRoleForMatch("");
      return;
    }
    const p = (allProjects as any[]).find((x: any) => x._id === selectedProjectId);
    if (!p || p.intakeForm?.hireType !== "team") {
      setTeamRoleForMatch("");
      return;
    }
    const roles = teamRoleOptionsForManualMatch(p);
    setTeamRoleForMatch(roles[0] ?? "");
  }, [selectedProjectId, allProjects]);

  // Filter freelancers by search and experience level
  const filteredFreelancers = useMemo(() => {
    if (!allFreelancers) return [];
    return (allFreelancers as any[]).filter((f: any) => {
      if (freelancerSearch) {
        const q = freelancerSearch.toLowerCase();
        const name = (f.name ?? "").toLowerCase();
        const email = (f.email ?? "").toLowerCase();
        const skills = ((f.profile?.skills as string[]) ?? []).join(" ").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !skills.includes(q)) return false;
      }
      if (experienceLevelFilter !== "any") {
        if (f.profile?.experienceLevel !== experienceLevelFilter) return false;
      }
      return true;
    });
  }, [allFreelancers, freelancerSearch, experienceLevelFilter]);

  const selectedProject = useMemo(
    () => (allProjects as any[] | undefined)?.find((p: any) => p._id === selectedProjectId),
    [allProjects, selectedProjectId]
  );

  const selectedFreelancer = useMemo(
    () => (allFreelancers as any[] | undefined)?.find((f: any) => f._id === selectedFreelancerId),
    [allFreelancers, selectedFreelancerId]
  );

  const handleAssign = async () => {
    if (!selectedProjectId || !selectedFreelancerId || !user?._id) return;
    setIsAssigning(true);
    try {
      await adminManualMatch({
        projectId: selectedProjectId as any,
        freelancerId: selectedFreelancerId as any,
        note: adminNote.trim() || undefined,
        userId: user._id,
        ...(selectedProject?.intakeForm?.hireType === "team" && teamRoleForMatch.trim()
          ? { teamRole: teamRoleForMatch.trim() }
          : {}),
      });
      toast.success("Candidate added. Client has been notified to review and select this freelancer.");
      setConfirmOpen(false);
      router.push(`/dashboard/projects/${selectedProjectId}`);
    } catch (err: any) {
      toast.error(getUserFriendlyError(err) || "Failed to assign freelancer");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-3" />
            <p className="text-muted-foreground">Only admins can access manual matching.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
        <Button variant="ghost" size="icon" className="shrink-0 self-start" asChild>
          <Link href="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <UserSearch className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
            <span>Manual Matching</span>
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground sm:text-base">
            Add a candidate to a matching hire. The client is notified to review and select from matches.
          </p>
        </div>
      </div>

      {/* Steps: stacked on phones, row from sm — no horizontal page scroll */}
      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 md:gap-3"
        aria-label="Assignment steps"
      >
        <div
          className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:text-sm ${
            !selectedProjectId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:h-5 sm:w-5 sm:text-xs">
            1
          </span>
          <span className="min-w-0 flex-1 sm:flex-none">Select hire</span>
        </div>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
        <div
          className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:text-sm ${
            selectedProjectId && !selectedFreelancerId
              ? "bg-primary text-primary-foreground"
              : selectedProjectId && selectedFreelancerId
                ? "bg-muted text-muted-foreground"
                : "bg-muted/50 text-muted-foreground/50"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:h-5 sm:w-5 sm:text-xs">
            2
          </span>
          <span className="min-w-0 flex-1 sm:flex-none">Select freelancer</span>
        </div>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
        <div
          className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:text-sm ${
            selectedProjectId && selectedFreelancerId
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground/50"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:h-5 sm:w-5 sm:text-xs">
            3
          </span>
          <span className="min-w-0 flex-1 sm:flex-none">Confirm &amp; assign</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left: Project selection */}
        <Card className={selectedProjectId ? "ring-2 ring-primary/30" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base leading-snug">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">Step 1 — Select hire</span>
            </CardTitle>
            <CardDescription className="text-pretty">
              Hires with awaitingMatch (including funded, before or after auto-match) or already in status matching.
              Single: no matched freelancer yet. Team: at least one open role or headcount slot. Automated matcher
              results do not affect this list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hire title..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Project list */}
            <div className="max-h-[50vh] space-y-2 overflow-y-auto overflow-x-hidden pr-1 sm:max-h-96">
              {allProjects === undefined ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading hires…</p>
              ) : matchableProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No eligible hires match your search.
                </p>
              ) : (
                matchableProjects.map((p: any) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(p._id === selectedProjectId ? null : p._id);
                      setSelectedFreelancerId(null);
                    }}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all hover:border-primary/50 hover:bg-muted/30 ${
                      selectedProjectId === p._id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.intakeForm?.title ?? "Untitled"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {p.intakeForm?.description ?? "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs py-0">
                            {p.intakeForm?.hireType === "team" ? "Team" : "Single"}
                          </Badge>
                          {p.intakeForm?.hireType === "team" &&
                            (p.manualMatchOpenTeamRoles as string[] | undefined)?.length ? (
                              <Badge variant="outline" className="text-xs py-0 border-amber-400 text-amber-700">
                                {(p.manualMatchOpenTeamRoles as string[]).length} team role
                                {(p.manualMatchOpenTeamRoles as string[]).length === 1 ? "" : "s"} open
                              </Badge>
                            ) : null}
                          <Badge
                            variant="outline"
                            className={`text-xs py-0 capitalize ${
                              p.status === "matching"
                                ? "border-blue-400 text-blue-600"
                                : p.status === "funded"
                                ? "border-green-400 text-green-600"
                                : "border-orange-400 text-orange-600"
                            }`}
                          >
                            {p.status.replace(/_/g, " ")}
                          </Badge>
                          {p.totalAmount && (
                            <span className="text-xs text-muted-foreground">
                              ${p.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedProjectId === p._id && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Freelancer selection */}
        <Card className={selectedFreelancerId ? "ring-2 ring-primary/30" : selectedProjectId ? "" : "opacity-50 pointer-events-none"}>
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base leading-snug">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">Step 2 — Select freelancer</span>
            </CardTitle>
            <CardDescription>
              Search all active freelancers. Admin override — scoring and vetting requirements are bypassed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, skills..."
                  value={freelancerSearch}
                  onChange={(e) => setFreelancerSearch(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
              <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <Star className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Freelancer list */}
            <div className="max-h-[50vh] space-y-2 overflow-y-auto overflow-x-hidden pr-1 sm:max-h-96">
              {allFreelancers === undefined ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading freelancers…</p>
              ) : filteredFreelancers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No freelancers match your search.
                </p>
              ) : (
                filteredFreelancers.map((f: any) => (
                  <button
                    key={f._id}
                    type="button"
                    onClick={() =>
                      setSelectedFreelancerId(f._id === selectedFreelancerId ? null : f._id)
                    }
                    className={`w-full text-left rounded-xl border p-3.5 transition-all hover:border-primary/50 hover:bg-muted/30 ${
                      selectedFreelancerId === f._id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {(f.name ?? "?")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{f.name}</p>
                          {selectedFreelancerId === f._id && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {f.profile?.experienceLevel && (
                            <Badge variant="secondary" className="text-xs py-0 capitalize">
                              {f.profile.experienceLevel}
                            </Badge>
                          )}
                          {f.profile?.techField && (
                            <Badge variant="outline" className="text-xs py-0 capitalize max-w-[120px] truncate">
                              {f.profile.techField.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {f.profile?.skills && f.profile.skills.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {(f.profile.skills as string[]).slice(0, 3).join(", ")}
                              {f.profile.skills.length > 3 && ` +${f.profile.skills.length - 3}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation section */}
      {selectedProjectId && selectedFreelancerId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <h3 className="text-sm font-semibold">Ready to assign</h3>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                  <span className="font-medium wrap-break-word text-foreground">
                    {selectedProject?.intakeForm?.title ?? "Hire"}
                  </span>
                  <span className="hidden sm:inline" aria-hidden>
                    ←
                  </span>
                  <span className="font-medium wrap-break-word text-foreground">
                    {selectedFreelancer?.name ?? "Freelancer"}
                  </span>
                </div>
                {selectedProject?.intakeForm?.hireType === "team" && (
                  <div className="max-w-full space-y-1.5 sm:max-w-md">
                    <Label className="text-xs">Team role for this candidate</Label>
                    {teamRoleOptionsForManualMatch(selectedProject).length > 0 ? (
                      <Select value={teamRoleForMatch} onValueChange={setTeamRoleForMatch}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamRoleOptionsForManualMatch(selectedProject).map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Open role will be inferred from intake (no labeled slots on file, or headcount-only team).
                      </p>
                    )}
                  </div>
                )}
                <p className="text-pretty text-xs text-muted-foreground">
                  The client will receive a match-found notification and can decide whether to select this candidate.
                </p>
              </div>
              <Button
                className="h-11 w-full shrink-0 sm:h-10 sm:w-auto"
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Assign freelancer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-h-[min(85dvh,48rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto overflow-x-hidden sm:w-full">
          <DialogHeader>
            <DialogTitle>Confirm Manual Assignment</DialogTitle>
            <DialogDescription>
              You are manually assigning{" "}
              <strong>{selectedFreelancer?.name}</strong> to{" "}
              <strong>&ldquo;{selectedProject?.intakeForm?.title}&rdquo;</strong>.
              This creates a candidate match for client review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 text-muted-foreground">Hire</span>
                <span className="wrap-break-word font-medium sm:min-w-0 sm:text-right">
                  {selectedProject?.intakeForm?.title}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 text-muted-foreground">Freelancer</span>
                <span className="wrap-break-word font-medium sm:min-w-0 sm:text-right">
                  {selectedFreelancer?.name}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 text-muted-foreground">Status after</span>
                <span className="wrap-break-word font-medium text-blue-600 sm:min-w-0 sm:max-w-[65%] sm:text-right">
                  Still matching (client reviews candidates)
                </span>
              </div>
            </div>

            {selectedProject?.intakeForm?.hireType === "team" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Team role</Label>
                {teamRoleOptionsForManualMatch(selectedProject).length > 0 ? (
                  <Select value={teamRoleForMatch} onValueChange={setTeamRoleForMatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamRoleOptionsForManualMatch(selectedProject).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Inferred from intake when there are no per-slot labels yet.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="admin-note" className="text-sm">
                Admin note <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Reason for manual assignment, special instructions..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isAssigning}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? "Assigning…" : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

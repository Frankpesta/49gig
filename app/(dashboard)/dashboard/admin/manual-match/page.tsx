"use client";

import { useState, useMemo } from "react";
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
  Filter,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

export default function AdminManualMatchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("funded,matching");
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("any");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const adminManualMatch = useMutation(api.matching.mutations.adminManualMatch);

  // Fetch projects suitable for manual matching (funded, matching, awaiting_freelancer)
  const allProjects = useQuery(
    (api as any)["projects/queries"].getProjects,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  // Fetch all active freelancers
  const allFreelancers = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id
      ? { role: "freelancer", status: "active", userId: user._id }
      : "skip"
  );

  // Filter projects by status and search
  const matchableProjects = useMemo(() => {
    if (!allProjects) return [];
    const statuses = new Set(projectStatusFilter.split(",").map((s) => s.trim()));
    return (allProjects as any[]).filter((p: any) => {
      if (!statuses.has(p.status)) return false;
      if (projectSearch) {
        const q = projectSearch.toLowerCase();
        const title = (p.intakeForm?.title ?? "").toLowerCase();
        if (!title.includes(q)) return false;
      }
      return true;
    });
  }, [allProjects, projectStatusFilter, projectSearch]);

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
      });
      toast.success("Freelancer manually assigned. They will be notified to accept or decline.");
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
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
    <div className="container mx-auto max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserSearch className="h-7 w-7 text-primary" />
            Manual Matching
          </h1>
          <p className="text-muted-foreground mt-1">
            Directly assign any active freelancer to a hire. The freelancer will receive an offer to accept or decline.
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3 text-sm">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition-colors ${!selectedProjectId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">1</span>
          Select Hire
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition-colors ${selectedProjectId && !selectedFreelancerId ? "bg-primary text-primary-foreground" : selectedProjectId && selectedFreelancerId ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50"}`}>
          <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">2</span>
          Select Freelancer
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition-colors ${selectedProjectId && selectedFreelancerId ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground/50"}`}>
          <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">3</span>
          Confirm &amp; Assign
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Project selection */}
        <Card className={selectedProjectId ? "ring-2 ring-primary/30" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Step 1 — Select Hire
            </CardTitle>
            <CardDescription>
              Choose the hire to assign a freelancer to. Only funded or matching hires are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hire title..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                <SelectTrigger className="w-40 h-9">
                  <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funded,matching">Funded &amp; Matching</SelectItem>
                  <SelectItem value="funded">Funded only</SelectItem>
                  <SelectItem value="matching">Matching only</SelectItem>
                  <SelectItem value="awaiting_freelancer">Awaiting Freelancer</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project list */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {allProjects === undefined ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading hires…</p>
              ) : matchableProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hires match the current filters.
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
                            {p.hireType === "team" ? "Team" : "Single"}
                          </Badge>
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
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Step 2 — Select Freelancer
            </CardTitle>
            <CardDescription>
              Search all active freelancers. Admin override — scoring and vetting requirements are bypassed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, skills..."
                  value={freelancerSearch}
                  onChange={(e) => setFreelancerSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
                <SelectTrigger className="w-40 h-9">
                  <Star className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
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
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
          <CardContent className="p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-sm">Ready to assign</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground truncate">
                    {selectedProject?.intakeForm?.title ?? "Hire"}
                  </span>
                  <span>←</span>
                  <span className="font-medium text-foreground truncate">
                    {selectedFreelancer?.name ?? "Freelancer"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  The freelancer will receive an offer notification and must accept before the contract is generated.
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Assign Freelancer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Manual Assignment</DialogTitle>
            <DialogDescription>
              You are manually assigning{" "}
              <strong>{selectedFreelancer?.name}</strong> to{" "}
              <strong>&ldquo;{selectedProject?.intakeForm?.title}&rdquo;</strong>.
              This bypasses the normal matching and scoring flow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hire</span>
                <span className="font-medium truncate ml-2">{selectedProject?.intakeForm?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Freelancer</span>
                <span className="font-medium">{selectedFreelancer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status after</span>
                <span className="font-medium text-orange-600">Awaiting freelancer acceptance</span>
              </div>
            </div>

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

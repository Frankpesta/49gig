"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormSection } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Building2, Briefcase, FileText, Star, Phone, AlertTriangle } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLATFORM_CATEGORIES,
  PROGRAMMING_LANGUAGES,
  SOFTWARE_DEV_FIELDS,
  getSkillsForCategory,
  getSoftwareDevFieldSkills,
  getSoftwareDevFieldLabel,
  type TechFieldValue,
  type ExperienceLevelValue,
} from "@/lib/platform-skills";
import { PROFILE_TIMEZONE_OPTIONS } from "@/lib/timezones";
import { ProfileCard } from "@/components/profile/profile-card";
import { FreelancerMatchingReadinessBanner } from "@/components/dashboard/freelancer-matching-readiness-banner";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import {
  requiresBehanceUrl,
  requiresGithubUrl,
  requiresProfessionalLink,
} from "@/lib/freelancer-profile-links";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2MB

const TIMEZONES_BY_REGION = PROFILE_TIMEZONE_OPTIONS.reduce<
  Record<string, typeof PROFILE_TIMEZONE_OPTIONS>
>((acc, tz) => {
  if (!acc[tz.region]) acc[tz.region] = [];
  acc[tz.region].push(tz);
  return acc;
}, {});

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    // Client fields
    companyName: "",
    companySize: "",
    industry: "",
    workEmail: "",
    companyWebsite: "",
    // Freelancer fields
    bio: "",
    techField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
    softwareDevField: "",
    availability: "available" as "available" | "busy" | "unavailable",
    country: "",
    timezone: "",
    portfolioUrl: "",
    githubUrl: "",
    behanceUrl: "",
    linkedinUrl: "",
    phoneNumber: "",
  });
  const [newSkill, setNewSkill] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProfileCardEditMode, setIsProfileCardEditMode] = useState(false);

  const updateProfile = useMutation(api.users.mutations.updateProfile);
  const generateProfileImageUploadUrl = useMutation(api.users.mutations.generateProfileImageUploadUrl);
  const setProfileImageFromStorageId = useMutation(api.users.mutations.setProfileImageFromStorageId);
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
  const profileForEdit = useQuery(
    api.users.queries.getProfileForEdit,
    (sessionToken || user?._id)
      ? { sessionToken: sessionToken ?? undefined, userId: user?._id }
      : "skip"
  );
  const displayUser = profileForEdit ?? user;
  const effectiveUser = displayUser ?? user;
  const resumeInfo = useQuery(
    // @ts-ignore dynamic path cast for generated types
    (api as any).resume.queries.getFreelancerResume,
    effectiveUser?._id ? { freelancerId: effectiveUser._id, requesterId: effectiveUser._id } : "skip"
  );
  const ratingStats = useQuery(
    (api as any)["reviews/queries"].getFreelancerRatingStats,
    effectiveUser?._id && effectiveUser?.role === "freelancer"
      ? { freelancerId: effectiveUser._id, viewerUserId: effectiveUser._id }
      : "skip"
  );
  const freelancerReviews = useQuery(
    (api as any)["reviews/queries"].getReviewsForFreelancer,
    effectiveUser?._id && effectiveUser?.role === "freelancer"
      ? { freelancerId: effectiveUser._id, userId: effectiveUser._id, limit: 10 }
      : "skip"
  );
  const matchingReadiness = useQuery(
    api.users.queries.getMyFreelancerMatchingReadiness,
    effectiveUser?._id && effectiveUser?.role === "freelancer"
      ? { userId: effectiveUser._id }
      : "skip"
  );

  // Initialize form data from user (profileForEdit ensures we get fresh data including signup skills/techField)
  useEffect(() => {
    const source = displayUser ?? user;
    if (source) {
      setFormData({
        name: source.name || "",
        companyName: source.profile?.companyName || "",
        companySize: source.profile?.companySize || "",
        industry: source.profile?.industry || "",
        workEmail: source.profile?.workEmail || "",
        companyWebsite: source.profile?.companyWebsite || "",
        bio: source.profile?.bio || "",
        techField: source.profile?.techField || "",
        experienceLevel: source.profile?.experienceLevel || "",
        skills: source.profile?.skills || [],
        languagesWritten: source.profile?.languagesWritten || [],
        softwareDevField: source.profile?.softwareDevFields?.[0] || "",
        availability: source.profile?.availability || "available",
        country: source.profile?.country || "",
        timezone: source.profile?.timezone || "",
        portfolioUrl: source.profile?.portfolioUrl || "",
        githubUrl: source.profile?.githubUrl || "",
        behanceUrl: source.profile?.behanceUrl || "",
        linkedinUrl: source.profile?.linkedinUrl || "",
        phoneNumber:
          source.profile?.phoneNumber?.trim() ||
          (source as { phoneE164?: string }).phoneE164?.trim() ||
          "",
      });
    }
  }, [displayUser, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = displayUser ?? user;
    if (!targetUser?._id) return;

    if (
      targetUser.role === "freelancer" &&
      formData.techField === "software_development" &&
      !formData.softwareDevField
    ) {
      toast.error("Please select your software focus (e.g. frontend, full-stack).");
      return;
    }

    if (targetUser.role === "freelancer") {
      const tf = formData.techField || undefined;
      if (requiresGithubUrl(tf) && !formData.githubUrl.trim()) {
        toast.error("GitHub profile URL is required for your category.");
        return;
      }
      if (requiresBehanceUrl(tf) && !formData.behanceUrl.trim()) {
        toast.error("Behance profile URL is required for design roles.");
        return;
      }
      if (
        requiresProfessionalLink(tf) &&
        !formData.linkedinUrl.trim() &&
        !formData.portfolioUrl.trim()
      ) {
        toast.error("Add a LinkedIn URL or a portfolio / website URL for your category.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      const isFreelancerProfile = targetUser.role === "freelancer";
      await updateProfile({
        name: formData.name,
        profile: {
          companyName: formData.companyName || undefined,
          companySize: formData.companySize || undefined,
          industry: formData.industry || undefined,
          workEmail: formData.workEmail || undefined,
          companyWebsite: formData.companyWebsite || undefined,
          bio: formData.bio || undefined,
          techField: (formData.techField || undefined) as TechFieldValue | undefined,
          experienceLevel: (formData.experienceLevel || undefined) as ExperienceLevelValue | undefined,
          skills: formData.skills.length > 0 ? formData.skills : undefined,
          languagesWritten: formData.languagesWritten.length > 0 ? formData.languagesWritten : undefined,
          ...(isFreelancerProfile
            ? {
                softwareDevFields:
                  formData.techField === "software_development" && formData.softwareDevField
                    ? [formData.softwareDevField]
                    : [],
              }
            : {}),
          availability: formData.availability,
          country: formData.country || undefined,
          timezone: formData.timezone || undefined,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          portfolioUrl: formData.portfolioUrl || undefined,
          ...(isFreelancerProfile
            ? {
                githubUrl: formData.githubUrl || undefined,
                behanceUrl: formData.behanceUrl || undefined,
                linkedinUrl: formData.linkedinUrl || undefined,
              }
            : {}),
        },
        userId: targetUser._id,
        sessionToken: sessionToken || undefined,
      });
      toast.success("Profile updated successfully");
      setIsProfileCardEditMode(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetUser = displayUser ?? user;
    if (!file || !targetUser?._id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPEG, PNG, etc.)");
      e.target.value = "";
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      toast.error("Image must be 2MB or smaller");
      e.target.value = "";
      return;
    }
    setIsUploadingImage(true);
    try {
      const uploadUrl = await generateProfileImageUploadUrl({
        userId: targetUser._id,
        sessionToken: typeof window !== "undefined" ? localStorage.getItem("sessionToken") ?? undefined : undefined,
      });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const res = await response.json();
      const storageId = typeof res === "string" ? res : res.storageId;
      if (!storageId) throw new Error("Upload did not return storageId");
      await setProfileImageFromStorageId({
        storageId,
        userId: targetUser._id,
        sessionToken: typeof window !== "undefined" ? localStorage.getItem("sessionToken") ?? undefined : undefined,
      });
      toast.success("Profile photo updated");
    } catch (err) {
      console.error("Failed to upload profile image:", err);
      toast.error(getUserFriendlyError(err) || "Failed to upload photo");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  const isClient = effectiveUser?.role === "client";
  const isFreelancer = effectiveUser?.role === "freelancer";

  const githubRequired =
    isFreelancer && requiresGithubUrl(formData.techField || undefined);
  const behanceRequired =
    isFreelancer && requiresBehanceUrl(formData.techField || undefined);
  const professionalLinkRequired =
    isFreelancer && requiresProfessionalLink(formData.techField || undefined);

  const freelancerSkillPicker =
    isFreelancer && formData.techField === "software_development"
      ? formData.softwareDevField
        ? getSoftwareDevFieldSkills([formData.softwareDevField])
        : []
      : isFreelancer && formData.techField
        ? getSkillsForCategory(formData.techField)
        : [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Profile"
        description="Manage your profile information and preferences."
        icon={User}
      />

      {isFreelancer &&
        matchingReadiness !== undefined &&
        matchingReadiness.issues.length > 0 && (
          <FreelancerMatchingReadinessBanner issuesOverride={matchingReadiness.issues} />
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Hero Card */}
        <ProfileCard
          name={formData.name || effectiveUser?.name || ""}
          email={effectiveUser?.email ?? ""}
          role={effectiveUser?.role ?? ""}
          imageUrl={effectiveUser?.profile?.imageUrl}
          techField={formData.techField || effectiveUser?.profile?.techField}
          experienceLevel={formData.experienceLevel || effectiveUser?.profile?.experienceLevel}
          availability={formData.availability}
          averageRating={ratingStats?.averageRating}
          reviewCount={ratingStats?.count}
          onPhotoChange={handleProfileImageChange}
          isUploading={isUploadingImage}
          isEditMode={isProfileCardEditMode}
          onEditClick={() => setIsProfileCardEditMode((prev) => !prev)}
        >
          <div className="space-y-4">
            <FormField label="Full Name" htmlFor="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-lg h-11"
                required
              />
            </FormField>
            <FormField label="Email" description="Email cannot be changed. Contact support if needed.">
              <Input id="email" value={effectiveUser?.email ?? ""} disabled className="rounded-lg h-11 bg-muted/50" />
            </FormField>
            <FormField label="Role">
              <Input id="role" value={effectiveUser?.role ?? ""} disabled className="rounded-lg h-11 bg-muted/50" />
            </FormField>
          </div>
        </ProfileCard>

        <Card className="rounded-xl overflow-hidden border-border/60">
          <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent py-4">
            <CardTitle className="text-base">Location & timezone</CardTitle>
            <CardDescription>Used for scheduling and client–freelancer matching.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 space-y-4">
            <FormField
              label="Country"
              htmlFor="country"
              description="Shown to clients on your match card."
            >
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. Nigeria, Kenya, United Kingdom"
                className="rounded-lg h-11 max-w-md"
              />
            </FormField>
            <FormField label="Your timezone" htmlFor="timezone">
              <Select
                value={formData.timezone || "__none__"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    timezone: value === "__none__" ? "" : value,
                  })
                }
              >
                <SelectTrigger id="timezone" className="rounded-lg h-11">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(24rem,70vh)]">
                  <SelectItem value="__none__">Not specified</SelectItem>
                  {Object.entries(TIMEZONES_BY_REGION).map(([region, list]) => (
                    <SelectGroup key={region}>
                      <SelectLabel className="px-2 py-1.5 text-xs text-muted-foreground">
                        {region}
                      </SelectLabel>
                      {list.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {isFreelancer && (
          <Card className="rounded-xl overflow-hidden border-border/60">
            <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact phone
              </CardTitle>
              <CardDescription>
                Used for project communication, support, and payout setup. Include your country code (e.g. +234…).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6 space-y-4">
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Use a real, working number
                </AlertTitle>
                <AlertDescription className="text-amber-800/90 dark:text-amber-200/80">
                  Clients and our team may call or message you about projects and payouts. Voicemail-only or
                  incorrect numbers can delay hiring and payments.
                </AlertDescription>
              </Alert>
              <FormField
                label="Mobile number"
                htmlFor="phoneNumber"
                description="Include country code. Example: +2348012345678"
              >
                <Input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+2348012345678"
                  className="rounded-lg h-11 max-w-md"
                />
              </FormField>
            </CardContent>
          </Card>
        )}

        {/* Client-Specific Fields */}
        {isClient && (
          <Card className="rounded-xl overflow-hidden border-border/60">
            <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>Your company details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormSection title="Company details" description="Used for project matching and verification.">
                <FormField label="Company Name" htmlFor="companyName">
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Your company name"
                    className="rounded-lg h-11"
                  />
                </FormField>
                <FormField label="Company Size" htmlFor="companySize">
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) =>
                      setFormData({ ...formData, companySize: value })
                    }
                  >
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Industry" htmlFor="industry" description="e.g., Technology, Healthcare, Finance">
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    placeholder="e.g., Technology, Healthcare, Finance"
                    className="rounded-lg h-11"
                  />
                </FormField>
                <FormField label="Work email" htmlFor="workEmail" description="Shown to freelancers once you hire them.">
                  <Input
                    id="workEmail"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, workEmail: e.target.value })
                    }
                    placeholder="work@company.com"
                    className="rounded-lg h-11"
                  />
                </FormField>
                <FormField label="Company website" htmlFor="companyWebsite">
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      setFormData({ ...formData, companyWebsite: e.target.value })
                    }
                    placeholder="https://company.com"
                    className="rounded-lg h-11"
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>
        )}

        {/* Freelancer-Specific Fields */}
        {isFreelancer && (
          <>
            <Card className="rounded-xl overflow-hidden border-border/60">
              <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Executive Summary
                </CardTitle>
                <CardDescription>
                  Generated from your resume. This section is read-only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resumeInfo?.resumeBio ? (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
                    {resumeInfo.resumeBio}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                    No executive summary yet. Upload your resume to generate one.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client feedback / reputation */}
            {isFreelancer && (
              <Card className="rounded-xl overflow-hidden border-border/60">
                <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Client feedback
                  </CardTitle>
                  <CardDescription>
                    {ratingStats && ratingStats.count > 0
                      ? `${ratingStats.averageRating}/5 average (${ratingStats.count} review${ratingStats.count !== 1 ? "s" : ""})`
                      : "Ratings from clients you've worked with"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {freelancerReviews && freelancerReviews.length > 0 ? (
                    <div className="space-y-4">
                      {freelancerReviews.map(
                        (r: { _id: string; rating: number; comment?: string; createdAt: number }) => (
                          <div key={r._id} className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-4 w-4 ${
                                    r.rating >= s ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {r.comment && (
                              <p className="text-sm">&quot;{r.comment}&quot;</p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No feedback yet. Complete hires and clients will be able to rate you.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl overflow-hidden border-border/60">
              <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your professional profile is managed by the platform. Contact support to request changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 space-y-4">
                {/* Read-only professional details */}
                {formData.techField && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
                      <p className="text-sm font-medium">{PLATFORM_CATEGORIES.find((c) => c.id === formData.techField)?.label ?? formData.techField}</p>
                    </div>
                    {formData.experienceLevel && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience Level</p>
                        <p className="text-sm font-medium capitalize">{formData.experienceLevel === "mid" ? "Mid-Level" : formData.experienceLevel}</p>
                      </div>
                    )}
                    {formData.softwareDevField && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Software Focus</p>
                        <p className="text-sm font-medium">{getSoftwareDevFieldLabel(formData.softwareDevField)}</p>
                      </div>
                    )}
                  </div>
                )}
                {formData.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {formData.languagesWritten.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Programming Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.languagesWritten.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* Availability and Portfolio are still editable */}
                <div className="pt-2 border-t border-border/40 space-y-4">
                  <FormField label="Availability" htmlFor="availability">
                    <Select
                      value={formData.availability}
                      onValueChange={(value: "available" | "busy" | "unavailable") =>
                        setFormData({ ...formData, availability: value })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-11 max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  {githubRequired && (
                    <FormField
                      label="GitHub profile URL"
                      htmlFor="githubUrl"
                      required
                      description="Link to your GitHub profile or org (github.com). Required for engineering and related categories."
                    >
                      <Input
                        id="githubUrl"
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        placeholder="https://github.com/yourusername"
                        className="rounded-lg h-11"
                        required
                      />
                    </FormField>
                  )}
                  {behanceRequired && (
                    <FormField
                      label="Behance profile URL"
                      htmlFor="behanceUrl"
                      required
                      description="Your Behance portfolio (behance.net). Required for design roles."
                    >
                      <Input
                        id="behanceUrl"
                        type="url"
                        value={formData.behanceUrl}
                        onChange={(e) => setFormData({ ...formData, behanceUrl: e.target.value })}
                        placeholder="https://www.behance.net/yourprofile"
                        className="rounded-lg h-11"
                        required
                      />
                    </FormField>
                  )}
                  {formData.techField && (
                    <>
                      <FormField
                        label="LinkedIn URL"
                        htmlFor="linkedinUrl"
                        description={
                          professionalLinkRequired
                            ? "Profile or company page on linkedin.com. Add this or a portfolio URL below (at least one required)."
                            : "Optional. Complements GitHub or Behance for clients reviewing your background."
                        }
                      >
                        <Input
                          id="linkedinUrl"
                          type="url"
                          value={formData.linkedinUrl}
                          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                          placeholder="https://www.linkedin.com/in/yourprofile"
                          className="rounded-lg h-11"
                        />
                      </FormField>
                      <FormField
                        label="Portfolio / website URL"
                        htmlFor="portfolioUrl"
                        description={
                          professionalLinkRequired
                            ? "Your site or portfolio, unless you already added LinkedIn above (at least one required)."
                            : "Optional personal site or portfolio."
                        }
                      >
                        <Input
                          id="portfolioUrl"
                          type="url"
                          value={formData.portfolioUrl}
                          onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                          placeholder="https://yourportfolio.com"
                          className="rounded-lg h-11"
                        />
                      </FormField>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


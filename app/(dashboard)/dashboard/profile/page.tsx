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
import { Loader2, Save, User, Building2, Briefcase, FileText, Star } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORM_CATEGORIES, PROGRAMMING_LANGUAGES, getSkillsForCategory, type TechFieldValue, type ExperienceLevelValue } from "@/lib/platform-skills";
import { ProfileCard } from "@/components/profile/profile-card";
import { toast } from "sonner";

const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2MB

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    // Client fields
    companyName: "",
    companySize: "",
    industry: "",
    // Freelancer fields
    bio: "",
    techField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
    hourlyRate: "",
    availability: "available" as "available" | "busy" | "unavailable",
    timezone: "",
    portfolioUrl: "",
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
    effectiveUser?._id && effectiveUser?.role === "freelancer" ? { freelancerId: effectiveUser._id } : "skip"
  );
  const freelancerReviews = useQuery(
    (api as any)["reviews/queries"].getReviewsForFreelancer,
    effectiveUser?._id && effectiveUser?.role === "freelancer"
      ? { freelancerId: effectiveUser._id, userId: effectiveUser._id, limit: 10 }
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
        bio: source.profile?.bio || "",
        techField: source.profile?.techField || "",
        experienceLevel: source.profile?.experienceLevel || "",
        skills: source.profile?.skills || [],
        languagesWritten: source.profile?.languagesWritten || [],
        hourlyRate: source.profile?.hourlyRate?.toString() || "",
        availability: source.profile?.availability || "available",
        timezone: source.profile?.timezone || "",
        portfolioUrl: source.profile?.portfolioUrl || "",
      });
    }
  }, [displayUser, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = displayUser ?? user;
    if (!targetUser?._id) return;

    setIsSaving(true);
    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      await updateProfile({
        name: formData.name,
        profile: {
          companyName: formData.companyName || undefined,
          companySize: formData.companySize || undefined,
          industry: formData.industry || undefined,
          bio: formData.bio || undefined,
          techField: (formData.techField || undefined) as TechFieldValue | undefined,
          experienceLevel: (formData.experienceLevel || undefined) as ExperienceLevelValue | undefined,
          skills: formData.skills.length > 0 ? formData.skills : undefined,
          languagesWritten: formData.languagesWritten.length > 0 ? formData.languagesWritten : undefined,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
          availability: formData.availability,
          timezone: formData.timezone || undefined,
          portfolioUrl: formData.portfolioUrl || undefined,
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
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Profile"
        description="Manage your profile information and preferences."
        icon={User}
      />

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
                      No feedback yet. Complete projects and clients will be able to rate you.
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
                <CardDescription>Category, skills, and programming languages (used for matching and verification)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormSection title="Professional details" description="Used for project matching and client verification.">
                <FormField label="Tech category" htmlFor="techField">
                  <Select
                    value={formData.techField}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        techField: value,
                        skills: [],
                      })
                    }
                  >
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                {formData.techField && (
                  <FormField label="Experience level" htmlFor="experienceLevel">
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, experienceLevel: value })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-11">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
                {formData.techField && getSkillsForCategory(formData.techField).length > 0 && (
                  <FormField label="Skills (from category)" description="Select skills that match your expertise.">
                    <div className="flex flex-wrap gap-2">
                      {getSkillsForCategory(formData.techField).map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant={formData.skills.includes(skill) ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            if (formData.skills.includes(skill)) {
                              removeSkill(skill);
                            } else {
                              setFormData({
                                ...formData,
                                skills: [...formData.skills, skill],
                              });
                            }
                        }}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </FormField>
                )}
                <FormField label="Programming languages" description="Languages you're proficient in.">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-border/60 rounded-lg">
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <label
                        key={lang}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.languagesWritten.includes(lang)}
                          onChange={() => {
                            const next = formData.languagesWritten.includes(lang)
                              ? formData.languagesWritten.filter((l) => l !== lang)
                              : [...formData.languagesWritten, lang];
                            setFormData({ ...formData, languagesWritten: next });
                          }}
                          className="rounded border-border"
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="About you" htmlFor="bio" description="Share a short overview of your experience and focus.">
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share a short overview of your experience and focus..."
                    rows={4}
                    className="rounded-lg"
                  />
                </FormField>
                <FormField label="Additional skills" htmlFor="skills" description="Add custom skills not in the category list.">
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Add a skill"
                      className="rounded-lg h-11"
                    />
                    <Button type="button" onClick={addSkill} variant="outline" className="rounded-lg">
                      Add
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="gap-2">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Hourly Rate ($)" htmlFor="hourlyRate">
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="rounded-lg h-11"
                    />
                  </FormField>
                  <FormField label="Availability" htmlFor="availability">
                    <Select
                      value={formData.availability}
                      onValueChange={(value: "available" | "busy" | "unavailable") =>
                        setFormData({ ...formData, availability: value })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Timezone" htmlFor="timezone" description="e.g., America/New_York">
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    placeholder="e.g., America/New_York"
                    className="rounded-lg h-11"
                  />
                </FormField>
                <FormField label="Portfolio URL" htmlFor="portfolioUrl" description="Link to your portfolio or website.">
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, portfolioUrl: e.target.value })
                    }
                    placeholder="https://yourportfolio.com"
                    className="rounded-lg h-11"
                  />
                </FormField>
              </FormSection>
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


"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Building2, Briefcase, Globe, Link as LinkIcon, FileText, Star, Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PLATFORM_CATEGORIES, PROGRAMMING_LANGUAGES, getSkillsForCategory, type TechFieldValue, type ExperienceLevelValue } from "@/lib/platform-skills";
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

  const updateProfile = useMutation(api.users.mutations.updateProfile);
  const generateProfileImageUploadUrl = useMutation(api.users.mutations.generateProfileImageUploadUrl);
  const setProfileImageFromStorageId = useMutation(api.users.mutations.setProfileImageFromStorageId);
  const resumeInfo = useQuery(
    // @ts-ignore dynamic path cast for generated types
    (api as any).resume.queries.getFreelancerResume,
    user?._id ? { freelancerId: user._id, requesterId: user._id } : "skip"
  );
  const ratingStats = useQuery(
    (api as any)["reviews/queries"].getFreelancerRatingStats,
    user?._id && user?.role === "freelancer" ? { freelancerId: user._id } : "skip"
  );
  const freelancerReviews = useQuery(
    (api as any)["reviews/queries"].getReviewsForFreelancer,
    user?._id && user?.role === "freelancer"
      ? { freelancerId: user._id, userId: user._id, limit: 10 }
      : "skip"
  );

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        companyName: user.profile?.companyName || "",
        companySize: user.profile?.companySize || "",
        industry: user.profile?.industry || "",
        bio: user.profile?.bio || "",
        techField: user.profile?.techField || "",
        experienceLevel: user.profile?.experienceLevel || "",
        skills: user.profile?.skills || [],
        languagesWritten: user.profile?.languagesWritten || [],
        hourlyRate: user.profile?.hourlyRate?.toString() || "",
        availability: user.profile?.availability || "available",
        timezone: user.profile?.timezone || "",
        portfolioUrl: user.profile?.portfolioUrl || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

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
        userId: user._id,
        sessionToken: sessionToken || undefined,
      });
      // Show success message (you can add a toast here)
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;
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
        userId: user._id,
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
        userId: user._id,
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

  const isClient = user.role === "client";
  const isFreelancer = user.role === "freelancer";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24 rounded-full border-2 border-border/60">
                  <AvatarImage src={user?.profile?.imageUrl} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingImage}
                    onChange={handleProfileImageChange}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                    <span>
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {isUploadingImage ? "Uploading…" : "Upload photo"}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">JPEG or PNG, max 2MB</p>
              </div>
              <div className="flex-1 space-y-4 min-w-0">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={user.role} disabled />
            </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client-Specific Fields */}
        {isClient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) =>
                    setFormData({ ...formData, companySize: value })
                  }
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Freelancer-Specific Fields */}
        {isFreelancer && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>Category, skills, and programming languages (used for matching and verification)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tech category</Label>
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
                    <SelectTrigger>
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
                </div>
                {formData.techField && (
                  <div className="space-y-2">
                    <Label>Experience level</Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, experienceLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.techField && getSkillsForCategory(formData.techField).length > 0 && (
                  <div className="space-y-2">
                    <Label>Skills (from category)</Label>
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
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Programming languages</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About you</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share a short overview of your experience and focus..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
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
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
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
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value: "available" | "busy" | "unavailable") =>
                        setFormData({ ...formData, availability: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    placeholder="e.g., America/New_York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Portfolio URL
                  </Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, portfolioUrl: e.target.value })
                    }
                    placeholder="https://yourportfolio.com"
                  />
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


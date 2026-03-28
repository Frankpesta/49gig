"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { BlogEditor, EMPTY_TIPTAP_DOC_JSON } from "@/components/blog/blog-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { Id } from "@/convex/_generated/dataModel";

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as Id<"blogPosts">;
  const { user } = useAuth();

  const post = useQuery(
    (api as any).blog.queries.getByIdForEdit,
    user?._id && postId ? { postId, userId: user._id } : "skip"
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [bannerImageId, setBannerImageId] = useState<Id<"_storage"> | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAs, setSubmittingAs] = useState<"draft" | "published" | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content ?? EMPTY_TIPTAP_DOC_JSON);
      setBannerImageId(post.bannerImageId ?? null);
      setStatus(post.status);
      setMetaTitle(post.metaTitle ?? "");
      setMetaDescription(post.metaDescription ?? "");
    }
  }, [post]);

  const updatePost = useMutation((api as any).blog.mutations.update);
  const generateUploadUrl = useMutation((api as any).blog.mutations.generateUploadUrl);
  const getStorageUrl = useAction((api as any).blog.actions.getStorageUrl);

  const handleImageUpload = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl({ userId: user?._id });
    const result = await fetch(uploadUrl, { method: "POST", body: file });
    if (!result.ok) throw new Error("Upload failed");
    const { storageId } = await result.json();
    const url = await getStorageUrl({ storageId });
    if (!url) throw new Error("Could not get image URL");
    return url;
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?._id) return;
    setIsUploadingBanner(true);
    try {
      const uploadUrl = await generateUploadUrl({ userId: user._id });
      const result = await fetch(uploadUrl, { method: "POST", body: file });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      setBannerImageId(storageId);
      toast.success("Banner uploaded");
    } catch (err) {
      toast.error(getUserFriendlyError(err) ?? "Upload failed");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const submitUpdate = async (nextStatus: "draft" | "published") => {
    if (!user?._id || !postId || !title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Excerpt is required");
      return;
    }
    setIsSubmitting(true);
    setSubmittingAs(nextStatus);
    try {
      await updatePost({
        userId: user._id,
        postId,
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim(),
        content: content.trim() ? content : EMPTY_TIPTAP_DOC_JSON,
        bannerImageId: bannerImageId ?? undefined,
        status: nextStatus,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      });
      setStatus(nextStatus);
      toast.success(nextStatus === "published" ? "Post published" : "Draft saved");
      router.push("/dashboard/blog");
    } catch (err) {
      toast.error(getUserFriendlyError(err) ?? "Failed to update");
    } finally {
      setIsSubmitting(false);
      setSubmittingAs(null);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Edit post" description="Edit blog post" icon={FileText} />
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">Only admins and moderators can edit posts.</p>
            <Button asChild className="mt-4 mx-auto block w-fit">
              <Link href="/dashboard/blog">Back to Blog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (post === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Edit post" description="Post not found" icon={FileText} />
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">Post not found.</p>
            <Button asChild className="mt-4 mx-auto block w-fit">
              <Link href="/dashboard/blog">Back to Blog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DashboardPageHeader
          title="Edit post"
          description={`Editing: ${post.title}`}
          icon={FileText}
        />
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Badge variant={status === "published" ? "default" : "secondary"} className="order-first sm:order-0">
            {status === "published" ? "Live on site" : "Draft"}
          </Badge>
          <div className="flex flex-wrap justify-end gap-2">
            {status === "published" && (
              <Button variant="outline" asChild>
                <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener">
                  View
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/blog">Cancel</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => void submitUpdate("draft")}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && submittingAs === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save draft
            </Button>
            <Button
              onClick={() => void submitUpdate("published")}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && submittingAs === "published" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Publish
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post details</CardTitle>
          <CardDescription>Title, slug, excerpt, and optional banner image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-post-title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for cards and SEO"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Banner image</Label>
            {post.bannerUrl && (
              <p className="text-sm text-muted-foreground">Current banner set. Upload a new file to replace.</p>
            )}
            <Input type="file" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} />
            {isUploadingBanner && <p className="text-sm text-muted-foreground">Uploading…</p>}
            {bannerImageId && <p className="text-sm text-green-600">New banner uploaded.</p>}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Save draft</span> keeps the post private.{" "}
            <span className="font-medium text-foreground">Publish</span> makes it visible on /blog (drafts are hidden
            there).
          </p>
          <div className="grid gap-2">
            <Label htmlFor="metaTitle">Meta title (SEO, optional)</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Custom page title for search engines"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="metaDescription">Meta description (SEO, optional)</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Short description for search results"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Use the toolbar for formatting and inline images.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlogEditor
            content={content}
            onChange={setContent}
            placeholder="Write your post content…"
            onImageUpload={handleImageUpload}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/blog">Cancel</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={() => void submitUpdate("draft")}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting && submittingAs === "draft" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Save draft
        </Button>
        <Button onClick={() => void submitUpdate("published")} disabled={isSubmitting} className="gap-2">
          {isSubmitting && submittingAs === "published" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Publish
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { FileText, Plus, Pencil, Trash2, Eye, Loader2, Send, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

type BlogPost = {
  _id: Id<"blogPosts">;
  title: string;
  slug: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  viewCount?: number;
};

export default function DashboardBlogPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === "moderator") router.replace("/dashboard");
  }, [isAuthenticated, user?.role, router]);
  const [deleteId, setDeleteId] = useState<Id<"blogPosts"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<Id<"blogPosts"> | null>(null);

  const posts = useQuery(
    (api as any).blog.queries.listAllForAdmin,
    isAuthenticated && user?._id && user.role === "admin"
      ? { userId: user._id, limit: 50 }
      : "skip"
  );
  const removePost = useMutation((api as any).blog.mutations.remove);
  const updatePost = useMutation((api as any).blog.mutations.update);

  const handlePublishDraft = async (postId: Id<"blogPosts">) => {
    if (!user?._id) return;
    setPublishingId(postId);
    try {
      await updatePost({ userId: user._id, postId, status: "published" });
      toast.success("Post published");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to publish");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user?._id) return;
    setIsDeleting(true);
    try {
      await removePost({ postId: deleteId, userId: user._id });
      toast.success("Post deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={FileText} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin") {
    return (
      <DashboardEmptyState
        icon={FileText}
        iconTone="muted"
        title="Access restricted"
        description="Only admins can manage the blog."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  const publishedCount = (posts ?? []).filter((p: BlogPost) => p.status === "published").length;
  const draftCount = (posts ?? []).filter((p: BlogPost) => p.status === "draft").length;
  const totalViews = (posts ?? []).reduce((sum: number, p: BlogPost) => sum + (p.viewCount ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <DashboardPageHeader
          title="Blog"
          description="Create and manage blog posts for the marketing site."
          icon={FileText}
        />
        <Button asChild className="shrink-0">
          <Link href="/dashboard/blog/new" className="gap-2">
            <Plus className="h-4 w-4" />
            New post
          </Link>
        </Button>
      </div>

      {posts === undefined ? (
        <DashboardLoadingState label="Loading posts" className="min-h-[200px]" />
      ) : posts.length === 0 ? (
        <DashboardEmptyState
          icon={FileText}
          iconTone="muted"
          title="No posts yet"
          description="Create your first blog post to show on the marketing site."
          action={
            <Button asChild>
              <Link href="/dashboard/blog/new">Create post</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
              <span className="font-semibold text-foreground">{posts.length}</span> total
            </span>
            <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
              <span className="font-semibold text-green-600">{publishedCount}</span> published
            </span>
            <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
              <span className="font-semibold text-orange-500">{draftCount}</span> drafts
            </span>
            <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
              <span className="font-semibold text-primary">{totalViews.toLocaleString()}</span> total views
            </span>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[90px]">Views</TableHead>
                  <TableHead className="w-[160px]">Last updated</TableHead>
                  <TableHead className="w-[130px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(posts as BlogPost[]).map((post) => (
                  <TableRow key={post._id} className="hover:bg-muted/20">
                    <TableCell>
                      <p className="font-medium text-sm">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/blog/{post.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "secondary"} className="capitalize">
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <BarChart2 className="h-3.5 w-3.5" />
                        {(post.viewCount ?? 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(post.updatedAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            title="Publish"
                            disabled={publishingId === post._id}
                            onClick={() => void handlePublishDraft(post._id)}
                          >
                            {publishingId === post._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View on site"
                            asChild
                          >
                            <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener">
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit"
                          asChild
                        >
                          <Link href={`/dashboard/blog/${post._id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                          onClick={() => setDeleteId(post._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => !isDeleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post and all its comments and likes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

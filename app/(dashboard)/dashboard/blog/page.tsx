"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { FileText, Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
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
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

export default function DashboardBlogPage() {
  const { user, isAuthenticated } = useAuth();
  const [deleteId, setDeleteId] = useState<Id<"blogPosts"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const posts = useQuery(
    (api as any).blog.queries.listAllForAdmin,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id, limit: 50 }
      : "skip"
  );
  const removePost = useMutation((api as any).blog.mutations.remove);

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

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={FileText}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can manage the blog."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DashboardPageHeader
          title="Blog"
          description="Create and manage blog posts for the marketing site."
          icon={FileText}
        />
        <Button asChild>
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
        <div className="grid gap-4">
          {posts.map((post: { _id: Id<"blogPosts">; title: string; slug: string; status: string; createdAt: number; updatedAt: number }) => (
            <Card key={post._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <CardDescription>
                      /blog/{post.slug} · {formatDistanceToNow(post.updatedAt, { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/blog/${post._id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(post._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => !isDeleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete post?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the post and all its comments and likes.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
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

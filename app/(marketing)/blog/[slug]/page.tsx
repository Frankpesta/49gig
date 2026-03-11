"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { BlogContentRenderer } from "@/components/blog/blog-content-renderer";
import { BlogComments } from "@/components/blog/blog-comments";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Calendar, User, Heart, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const post = useQuery(
    (api as any).blog.queries.getBySlug,
    slug ? { slug } : "skip"
  );
  const likeData = useQuery(
    (api as any).blog.queries.getLikeCountAndUserLiked,
    post?._id ? { postId: post._id, ...(user?._id && { userId: user._id }) } : "skip"
  );
  const toggleLike = useMutation((api as any).blog.mutations.toggleLike);

  const handleLove = async () => {
    if (!user?._id) {
      toast.error("Sign in to like this post");
      return;
    }
    if (!post?._id) return;
    try {
      await toggleLike({ postId: post._id, userId: user._id });
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Could not update like");
    }
  };

  if (slug && post === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-semibold text-foreground mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">The post may have been removed or the link is incorrect.</p>
        <Button asChild>
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  if (post === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const postId = post._id as Id<"blogPosts">;
  const count = likeData?.count ?? 0;
  const userLiked = likeData?.userLiked ?? false;

  return (
    <div className="w-full">
      <PageHero
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: "Blog", href: "/blog", icon: BookOpen },
          { label: post.title },
        ]}
        imageSrc={post.bannerUrl ?? undefined}
        imageAlt={post.title}
        imageUnoptimized={!!post.bannerUrl}
      />

      <article className="relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
              </span>
            )}
            {post.author?.name && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author.name}
              </span>
            )}
          </div>

          <div className="prose-custom">
            <BlogContentRenderer contentJson={post.content ?? "{}"} className="text-foreground" />
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant={userLiked ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={handleLove}
                disabled={!user?._id}
              >
                <Heart className={`h-4 w-4 ${userLiked ? "fill-current" : ""}`} />
                {count} {count === 1 ? "love" : "loves"}
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-2">
                <Link href="/blog" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Blog
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 pt-10 border-t border-border">
            <BlogComments
              postId={postId}
              currentUserId={user?._id}
              isAdminOrModerator={user?.role === "admin" || user?.role === "moderator"}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

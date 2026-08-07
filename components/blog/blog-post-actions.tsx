"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { BlogComments } from "@/components/blog/blog-comments";

export function BlogPostActions({ postId }: { postId: Id<"blogPosts"> }) {
  const { user } = useAuth();
  const likeData = useQuery(
    (api as any).blog.queries.getLikeCountAndUserLiked,
    { postId, ...(user?._id && { userId: user._id }) }
  );
  const toggleLike = useMutation((api as any).blog.mutations.toggleLike);
  const incrementViewCount = useMutation((api as any).blog.mutations.incrementViewCount);

  // Fire once when the post first loads — tracks a page view for the admin
  useEffect(() => {
    void incrementViewCount({ postId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const count = likeData?.count ?? 0;
  const userLiked = likeData?.userLiked ?? false;

  const handleLove = async () => {
    if (!user?._id) {
      toast.error("Sign in to like this post");
      return;
    }
    try {
      await toggleLike({ postId, userId: user._id });
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Could not update like");
    }
  };

  return (
    <>
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
    </>
  );
}

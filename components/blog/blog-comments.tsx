"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Send, Reply, Loader2, Trash2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

function buildCommentTree(
  flat: { _id: Id<"blogComments">; parentId?: Id<"blogComments">; content: string; authorDisplayName: string; createdAt: number; authorId?: Id<"users"> }[]
): { comment: typeof flat[0]; children: ReturnType<typeof buildCommentTree> }[] {
  const byParent = new Map<string, typeof flat>();
  const roots: typeof flat = [];
  for (const c of flat) {
    const key = c.parentId ?? "root";
    if (key === "root") roots.push(c);
    else {
      const list = byParent.get(key) ?? [];
      list.push(c);
      byParent.set(key, list);
    }
  }
  roots.sort((a, b) => a.createdAt - b.createdAt);
  const wrap = (comment: typeof flat[0]): { comment: typeof flat[0]; children: ReturnType<typeof buildCommentTree> } => ({
    comment,
    children: (byParent.get(comment._id) ?? []).sort((a, b) => a.createdAt - b.createdAt).map(wrap),
  });
  return roots.map(wrap);
}

function CommentNode({
  postId,
  node,
  currentUserId,
  canDelete,
  depth,
}: {
  postId: Id<"blogPosts">;
  node: { comment: { _id: Id<"blogComments">; content: string; authorDisplayName: string; createdAt: number; authorId?: Id<"users"> }; children: { comment: any; children: any[] }[] };
  currentUserId?: Id<"users">;
  canDelete: (authorId?: Id<"users">) => boolean;
  depth: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(node.comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = useMutation((api as any).blog.mutations.createComment);
  const updateComment = useMutation((api as any).blog.mutations.updateComment);
  const deleteComment = useMutation((api as any).blog.mutations.deleteComment);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({
        postId,
        parentId: node.comment._id,
        userId: currentUserId,
        authorName: currentUserId ? undefined : "Guest",
        content: replyText.trim(),
      });
      setReplyText("");
      setReplyOpen(false);
      toast.success("Reply posted");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (editText.trim() === node.comment.content) {
      setEditOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await updateComment({
        commentId: node.comment._id,
        userId: currentUserId,
        content: editText.trim(),
      });
      setEditOpen(false);
      toast.success("Comment updated");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment({ commentId: node.comment._id, userId: currentUserId });
      toast.success("Comment deleted");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to delete");
    }
  };

  const canEdit = canDelete(node.comment.authorId);

  return (
    <div className={depth > 0 ? "ml-6 sm:ml-8 mt-4 pl-4 border-l-2 border-border/60" : "mt-4"}>
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {node.comment.authorDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{node.comment.authorDisplayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(node.comment.createdAt, { addSuffix: true })}
            </span>
            {canEdit && (
              <span className="flex items-center gap-1 ml-auto">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(!editOpen)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </span>
            )}
          </div>
          {editOpen ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={isSubmitting} className="gap-1">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditOpen(false); setEditText(node.comment.content); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{node.comment.content}</p>
          )}
          {!editOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-8 text-xs gap-1"
              onClick={() => setReplyOpen(!replyOpen)}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </Button>
          )}
          {replyOpen && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyText.trim()} className="gap-1">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="mt-2">
          {node.children.map((child) => (
            <CommentNode
              key={child.comment._id}
              postId={postId}
              node={child}
              currentUserId={currentUserId}
              canDelete={canDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BlogComments({
  postId,
  currentUserId,
  isAdminOrModerator,
}: {
  postId: Id<"blogPosts">;
  currentUserId?: Id<"users">;
  isAdminOrModerator: boolean;
}) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = useQuery((api as any).blog.queries.getCommentsForPost, { postId });
  const addComment = useMutation((api as any).blog.mutations.createComment);

  const canDelete = (authorId?: Id<"users">): boolean =>
    Boolean(isAdminOrModerator || (currentUserId && authorId === currentUserId));

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Write a comment");
      return;
    }
    if (!currentUserId && !authorName.trim()) {
      toast.error("Please enter your name or sign in");
      return;
    }
    setIsSubmitting(true);
    try {
      await addComment({
        postId,
        userId: currentUserId,
        authorName: currentUserId ? undefined : authorName.trim(),
        authorEmail: currentUserId ? undefined : authorEmail.trim() || undefined,
        content: content.trim(),
      });
      setContent("");
      setAuthorName("");
      setAuthorEmail("");
      toast.success("Comment posted");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tree = comments ? buildCommentTree(comments) : [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Comments {comments != null && `(${comments.length})`}
      </h3>

      <div className="space-y-4">
        <Textarea
          placeholder="Add a comment…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
        />
        {!currentUserId && (
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post comment
        </Button>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
        ) : (
          tree.map((node) => (
            <CommentNode
              key={node.comment._id}
              postId={postId}
              node={node}
              currentUserId={currentUserId}
              canDelete={canDelete}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { BlogPostActions } from "@/components/blog/blog-post-actions";
import { fetchPublishedBlogPostBySlug } from "@/lib/seo/blog-post-server";
import { renderBlogContentHtml, blogContentProseClassNames } from "@/lib/blog/render-content-html";
import { EMPTY_TIPTAP_DOC_JSON } from "@/lib/blog/tiptap-doc";
import { BookOpen, Calendar, User } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export const revalidate = 300;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postId = post._id as Id<"blogPosts">;
  const contentJson =
    typeof post.content === "string" && post.content.trim() ? post.content : EMPTY_TIPTAP_DOC_JSON;
  const html = renderBlogContentHtml(contentJson);

  return (
    <div className="w-full">
      <PageHero
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: "Blog", href: "/blog", icon: BookOpen },
          { label: post.title },
        ]}
        pathname={`/blog/${slug}`}
      />

      <article className="relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {post.author?.name && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author.name}
              </span>
            )}
          </div>

          <div
            className={`text-foreground ${blogContentProseClassNames}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <BlogPostActions postId={postId} />
        </div>
      </article>
    </div>
  );
}

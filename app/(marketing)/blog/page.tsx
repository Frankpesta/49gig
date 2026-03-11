"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

export default function BlogListingPage() {
  const result = useQuery((api as any).blog.queries.listPublished, { limit: 24 });

  return (
    <div className="w-full">
      <PageHero
        title="Blog"
        description="Insights, updates, and stories from the 49GIG team and our community."
        badge={{ icon: BookOpen, text: "Blog" }}
        breadcrumbs={[{ label: "Blog", href: "/blog", icon: BookOpen }]}
      />

      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {result === undefined ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden border-border/60">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-5">
                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-3" />
                    <div className="h-4 w-full bg-muted/80 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !result.posts.length ? (
            <div className="text-center py-20">
              <BookOpen className="mx-auto h-14 w-14 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No posts yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're preparing great content. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {result.posts.map((post: {
                _id: string;
                slug: string;
                title: string;
                excerpt: string;
                publishedAt?: number;
                bannerUrl: string | null;
                authorName: string | null;
              }) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden border-border/60 h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      {post.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.bannerUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
                          </span>
                        )}
                        {post.authorName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {post.authorName}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Read more
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

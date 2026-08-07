import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPostNotFound() {
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

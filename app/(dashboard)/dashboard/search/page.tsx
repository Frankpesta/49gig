"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Search, ExternalLink } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchRow = {
  kind: string;
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export default function DashboardSearchPage() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { user } = useAuth();

  const results = useQuery(
    (api as any).dashboard.queries.searchByIdAdmin,
    user?._id && q ? { id: q, userId: user._id } : "skip"
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Global ID Search"
        description="Search result across database entities by exact ID."
        icon={Search}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Query: <span className="font-mono">{q || "—"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!q && (
            <p className="text-sm text-muted-foreground">
              Enter an ID in the dashboard header search bar.
            </p>
          )}
          {q && results === undefined && (
            <p className="text-sm text-muted-foreground">Searching…</p>
          )}
          {q && results != null && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No record matched this ID.
            </p>
          )}

          {(results as SearchRow[] | undefined)?.map((row) => (
            <div
              key={`${row.kind}-${row.id}`}
              className="rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {row.kind.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {row.id}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{row.title}</p>
                  {row.subtitle ? (
                    <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                  ) : null}
                </div>
                {row.href ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={row.href}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

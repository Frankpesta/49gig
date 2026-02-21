"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Save, RotateCcw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TALENT_CATEGORY_LABELS } from "@/lib/platform-skills";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";

const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "expert"] as const;
type Level = (typeof EXPERIENCE_LEVELS)[number];

const DEFAULT_RATES: Record<string, { junior: number; mid: number; senior: number; expert: number }> = {
  "Software Development": { junior: 30, mid: 55, senior: 90, expert: 140 },
  "UI/UX and Product Design": { junior: 25, mid: 45, senior: 75, expert: 115 },
  "Data Analytics": { junior: 28, mid: 50, senior: 85, expert: 130 },
  "DevOps and Cloud Engineering": { junior: 32, mid: 58, senior: 95, expert: 145 },
  "Cyber Security and IT Infrastructure": { junior: 35, mid: 60, senior: 100, expert: 155 },
  "AI, Machine Learning and Blockchain": { junior: 38, mid: 65, senior: 110, expert: 170 },
  "Quality Assurance and Testing": { junior: 24, mid: 42, senior: 70, expert: 108 },
};

function buildEmptyRates(): Record<string, { junior: number; mid: number; senior: number; expert: number }> {
  const out: Record<string, { junior: number; mid: number; senior: number; expert: number }> = {};
  for (const cat of TALENT_CATEGORY_LABELS) {
    out[cat] = DEFAULT_RATES[cat] ?? { junior: 0, mid: 0, senior: 0, expert: 0 };
  }
  return out;
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const config = useQuery(api.pricing.queries.getPricingConfig);
  const setPricingBaseRates = useMutation(api.pricing.mutations.setPricingBaseRates);

  const [rates, setRates] = useState<Record<string, { junior: number; mid: number; senior: number; expert: number }>>(buildEmptyRates);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const hydrateFromConfig = useCallback(() => {
    if (config === undefined) return;
    const next = buildEmptyRates();
    for (const category of TALENT_CATEGORY_LABELS) {
      const fromConfig = config[category];
      if (
        fromConfig &&
        typeof fromConfig.junior === "number" &&
        typeof fromConfig.mid === "number" &&
        typeof fromConfig.senior === "number" &&
        typeof fromConfig.expert === "number"
      ) {
        next[category] = { ...fromConfig };
      }
    }
    setRates(next);
    setTouched(false);
  }, [config]);

  useEffect(() => {
    hydrateFromConfig();
  }, [hydrateFromConfig]);

  const handleChange = (category: string, level: Level, value: string) => {
    const parsed = value.trim() === "" ? 0 : parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return;
    setRates((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] ?? { junior: 0, mid: 0, senior: 0, expert: 0 }),
        [level]: parsed,
      },
    }));
    setTouched(true);
  };

  const handleSave = async () => {
    if (!user?._id) {
      toast.error("Not authenticated");
      return;
    }
    setSaving(true);
    try {
      const toSave: Record<string, { junior: number; mid: number; senior: number; expert: number }> = {};
      for (const cat of TALENT_CATEGORY_LABELS) {
        const r = rates[cat];
        if (r && [r.junior, r.mid, r.senior, r.expert].every((n) => typeof n === "number" && n >= 0)) {
          toSave[cat] = r;
        }
      }
      if (Object.keys(toSave).length === 0) {
        toast.error("Add at least one category with valid rates (≥ 0).");
        setSaving(false);
        return;
      }
      await setPricingBaseRates({
        ratesByCategory: toSave,
        userId: user._id,
      });
      setTouched(false);
      toast.success("Base rates saved. Project budgets will use these rates per tech stack.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setRates(buildEmptyRates());
    setTouched(true);
    toast.info("Reset to platform defaults. Click Save to apply.");
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={DollarSign} title="Please log in." />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={DollarSign}
        title="Access restricted"
        description="Only admins and moderators can manage pricing."
      />
    );
  }

  const isLoading = config === undefined;

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Base rates by tech stack"
        description="Set hourly base rates (USD) per talent category and experience level. These rates drive budget estimates when clients create projects."
      />

      {isLoading ? (
        <DashboardLoadingState label="Loading pricing..." />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={saving || !touched} size="default">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save base rates
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="default" onClick={handleResetToDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to defaults
            </Button>
            {touched && (
              <span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {TALENT_CATEGORY_LABELS.map((category) => {
              const r = rates[category] ?? { junior: 0, mid: 0, senior: 0, expert: 0 };
              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">{category}</CardTitle>
                    <CardDescription>Hourly base rates (USD) by experience level</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <div key={level} className="space-y-1.5">
                          <Label className="text-xs capitalize text-muted-foreground">{level}</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={rates[category]?.[level] ?? r[level]}
                            onChange={(e) => handleChange(category, level, e.target.value)}
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

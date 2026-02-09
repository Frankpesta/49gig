"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TALENT_CATEGORIES = [
  "Software Development",
  "UI/UX & Product Design",
  "Data & Analytics",
] as const;

const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "expert"] as const;

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const config = useQuery(api.pricing.queries.getPricingConfig);
  const setPricingBaseRates = useMutation(api.pricing.mutations.setPricingBaseRates);

  const [rates, setRates] = useState<Record<string, { junior: number; mid: number; senior: number; expert: number }>>({});
  const [saving, setSaving] = useState(false);

  // Sync form from server when config loads
  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      setRates(config);
    }
  }, [config]);

  const handleChange = (
    category: string,
    level: "junior" | "mid" | "senior" | "expert",
    value: string
  ) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setRates((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] ?? { junior: 0, mid: 0, senior: 0, expert: 0 }),
        [level]: num,
      },
    }));
  };

  const handleSave = async () => {
    if (!user?._id) {
      toast.error("Not authenticated");
      return;
    }
    setSaving(true);
    try {
      const toSave: Record<string, { junior: number; mid: number; senior: number; expert: number }> = {};
      for (const cat of TALENT_CATEGORIES) {
        const r = rates[cat];
        if (r && [r.junior, r.mid, r.senior, r.expert].every((n) => typeof n === "number" && n >= 0)) {
          toSave[cat] = r;
        }
      }
      if (Object.keys(toSave).length === 0) {
        toast.error("Set at least one category with valid rates");
        setSaving(false);
        return;
      }
      await setPricingBaseRates({
        ratesByCategory: toSave,
        userId: user._id,
      });
      toast.success("Base rates saved. Project budgets will use these rates per tech stack.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in.</p>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Only admins and moderators can manage pricing.</p>
      </div>
    );
  }

  const displayRates = Object.keys(rates).length > 0 ? rates : (config ?? {});
  const isLoading = config === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Base rates by tech stack
        </h1>
        <p className="text-muted-foreground mt-1">
          Set hourly base rates (USD) per talent category and experience level. These drive budget
          estimates when clients create projects.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading pricing…
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Hourly base rates (USD)</CardTitle>
            <CardDescription>
              Different tech stacks can have different rates (e.g. Software Dev vs UI/UX vs Data).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {TALENT_CATEGORIES.map((category) => {
              const r = displayRates[category] ?? {
                junior: 0,
                mid: 0,
                senior: 0,
                expert: 0,
              };
              return (
                <div key={category} className="space-y-4">
                  <h3 className="font-medium text-lg">{category}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <div key={level} className="space-y-2">
                        <Label className="capitalize">{level}</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={rates[category]?.[level] ?? r[level]}
                          onChange={(e) => handleChange(category, level, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save base rates"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

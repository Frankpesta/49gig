"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TeamSlotIntake } from "@/lib/team-slots";
import {
  PLATFORM_ROLES,
  SOFTWARE_DEV_FIELDS,
  getSkillsForRole,
  getSoftwareDevFieldSkills,
  getSoftwareDevFieldLabel,
  getRoleLabel,
} from "@/lib/platform-skills";
import { Copy, Users } from "lucide-react";

export interface TeamSlotsEditorProps {
  slots: TeamSlotIntake[];
  onSlotsChange: (next: TeamSlotIntake[]) => void;
  className?: string;
}

function updateSlot(
  slots: TeamSlotIntake[],
  index: number,
  patch: Partial<TeamSlotIntake>
): TeamSlotIntake[] {
  const next = [...slots];
  const cur = next[index] ?? { roleId: "", skills: [] };
  let merged: TeamSlotIntake = { ...cur, ...patch };

  if (patch.roleId !== undefined && patch.roleId !== cur.roleId) {
    merged = {
      ...merged,
      skills: [],
      softwareDevFieldId: undefined,
      experienceLevel: undefined,
    };
  }
  if (
    patch.softwareDevFieldId !== undefined &&
    patch.softwareDevFieldId !== cur.softwareDevFieldId
  ) {
    merged = { ...merged, skills: [] };
  }

  next[index] = merged;
  return next;
}

export function TeamSlotsEditor({
  slots,
  onSlotsChange,
  className,
}: TeamSlotsEditorProps) {
  const copyFromFirst = (index: number) => {
    if (index === 0 || !slots[0]?.roleId) return;
    const first = slots[0];
    const next = [...slots];
    next[index] = {
      roleId: first.roleId,
      softwareDevFieldId: first.softwareDevFieldId,
      skills: [...(first.skills ?? [])],
    };
    onSlotsChange(next);
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            One seat per freelancer
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Define each role explicitly—e.g. two Frontend developers and one
            Backend developer are three separate seats. You can duplicate the
            first seat to similar roles, then tweak skills.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {slots.map((slot, index) => {
          const roleLabel = slot.roleId ? getRoleLabel(slot.roleId) : null;
          const skillsForPicker =
            slot.roleId === "software_development"
              ? slot.softwareDevFieldId
                ? getSoftwareDevFieldSkills([slot.softwareDevFieldId])
                : []
              : slot.roleId
                ? getSkillsForRole(slot.roleId)
                : [];

          const ready =
            !!slot.roleId &&
            (slot.roleId !== "software_development" || !!slot.softwareDevFieldId);

          return (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card transition-shadow",
                ready
                  ? "border-border/80 shadow-sm shadow-black/[0.04] dark:shadow-black/20"
                  : "border-dashed border-amber-500/40 bg-amber-500/[0.03]"
              )}
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-90" />
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="h-7 rounded-md px-2.5 font-mono text-xs font-semibold tabular-nums"
                    >
                      Seat {index + 1}
                    </Badge>
                    {roleLabel ? (
                      <span className="text-sm font-medium text-foreground">
                        {roleLabel}
                        {slot.roleId === "software_development" &&
                          slot.softwareDevFieldId && (
                            <span className="text-muted-foreground">
                              {" "}
                              ·{" "}
                              {getSoftwareDevFieldLabel(slot.softwareDevFieldId)}
                            </span>
                          )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Choose a role below
                      </span>
                    )}
                  </div>
                  {index > 0 && slots[0]?.roleId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyFromFirst(index)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Match seat 1
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Role
                    </Label>
                    <Select
                      value={slot.roleId || "__none__"}
                      onValueChange={(v) =>
                        onSlotsChange(
                          updateSlot(slots, index, {
                            roleId: v === "__none__" ? "" : v,
                          })
                        )
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                        <SelectValue placeholder="Select role…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">Choose…</span>
                        </SelectItem>
                        {PLATFORM_ROLES.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {slot.roleId === "software_development" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Specialisation
                      </Label>
                      <Select
                        value={slot.softwareDevFieldId || "__none__"}
                        onValueChange={(v) =>
                          onSlotsChange(
                            updateSlot(slots, index, {
                              softwareDevFieldId:
                                v === "__none__" ? undefined : v,
                            })
                          )
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue placeholder="e.g. Frontend, Backend…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Choose…</SelectItem>
                          {SOFTWARE_DEV_FIELDS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {slot.roleId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Experience for this seat
                      </Label>
                      <Select
                        value={slot.experienceLevel ?? "__default__"}
                        onValueChange={(v) =>
                          onSlotsChange(
                            updateSlot(slots, index, {
                              experienceLevel:
                                v === "__default__" ? undefined : (v as TeamSlotIntake["experienceLevel"]),
                            })
                          )
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background">
                          <SelectValue placeholder="Use project default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">
                            Same as project default
                          </SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="mid">Mid-Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {ready && skillsForPicker.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Key skills for this seat
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Pick what this person should be strongest in—we use this
                      for vetting and matching.
                    </p>
                    <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2">
                      {skillsForPicker.map((skill) => {
                        const active = slot.skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              const skills = active
                                ? slot.skills.filter((s) => s !== skill)
                                : [...slot.skills, skill];
                              onSlotsChange(updateSlot(slots, index, { skills }));
                            }}
                            className={cn(
                              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                              active
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/60 bg-background hover:border-primary/50 hover:bg-muted/50"
                            )}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

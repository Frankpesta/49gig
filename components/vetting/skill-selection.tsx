"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Code, FileText, Palette } from "lucide-react";
import { SkillAssessment } from "./skill-assessment";
import type { Doc } from "@/convex/_generated/dataModel";

interface SkillSelectionProps {
  skills: string[];
  experienceLevel: "junior" | "mid" | "senior" | "expert";
  completedAssessments: Array<{
    skillId: string;
    skillName: string;
    score: number;
  }>;
  onAssessmentComplete?: (skillName: string, score: number) => void;
}

// Determine assessment type based on skill
function getAssessmentType(skillName: string): "mcq" | "coding" | "portfolio" {
  const skillLower = skillName.toLowerCase();
  
  // Development skills use coding
  const codingSkills = [
    "react", "javascript", "typescript", "python", "java", "node.js",
    "next.js", "vue.js", "angular", "c++", "c#", "go", "rust", "php",
    "ruby", "swift", "kotlin", "flutter", "react native", "mobile dev",
    "backend", "frontend", "full stack", "aws", "azure", "gcp", "docker",
    "kubernetes", "devops", "cloud"
  ];
  
  if (codingSkills.some(s => skillLower.includes(s))) {
    return "coding";
  }
  
  // Writing/content skills use portfolio
  const portfolioSkills = [
    "technical writing", "data science",
    "data analyst", "ui/ux", "design", "figma", "sketch"
  ];
  
  if (portfolioSkills.some(s => skillLower.includes(s))) {
    return "portfolio";
  }
  
  // Default to MCQ for other skills
  return "mcq";
}

export function SkillSelection({
  skills,
  experienceLevel,
  completedAssessments,
  onAssessmentComplete,
}: SkillSelectionProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [activeAssessment, setActiveAssessment] = useState<string | null>(null);

  const availableSkills = skills.filter(
    (skill) => !completedAssessments.some((ca) => ca.skillName === skill)
  );

  const handleStartAssessment = () => {
    if (selectedSkill) {
      setActiveAssessment(selectedSkill);
    }
  };

  const handleAssessmentComplete = (score: number) => {
    if (selectedSkill && onAssessmentComplete) {
      onAssessmentComplete(selectedSkill, score);
    }
    setActiveAssessment(null);
    setSelectedSkill("");
    // Refresh page to show updated status
    window.location.reload();
  };

  if (activeAssessment) {
    const assessmentType = getAssessmentType(activeAssessment);
    return (
      <SkillAssessment
        skillName={activeAssessment}
        experienceLevel={experienceLevel}
        assessmentType={assessmentType}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Assessment</CardTitle>
          <CardDescription>
            Complete assessments for your skills. You can assess multiple skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Completed Assessments */}
          {completedAssessments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Completed Assessments</h3>
              <div className="flex flex-wrap gap-2">
                {completedAssessments.map((assessment) => (
                  <Badge
                    key={assessment.skillId}
                    variant="outline"
                    className="bg-green-50 border-green-200"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                    {assessment.skillName} ({assessment.score}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Skills */}
          {availableSkills.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a skill to assess:</label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => {
                      const assessmentType = getAssessmentType(skill);
                      const icon =
                        assessmentType === "coding" ? (
                          <Code className="h-4 w-4 mr-2" />
                        ) : assessmentType === "portfolio" ? (
                          <FileText className="h-4 w-4 mr-2" />
                        ) : (
                          <Palette className="h-4 w-4 mr-2" />
                        );
                      
                      return (
                        <SelectItem key={skill} value={skill}>
                          <div className="flex items-center">
                            {icon}
                            {skill}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {assessmentType === "coding"
                                ? "Coding"
                                : assessmentType === "portfolio"
                                ? "Portfolio"
                                : "MCQ"}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedSkill && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    {getAssessmentType(selectedSkill) === "coding" ? (
                      <Code className="h-5 w-5 text-primary mt-0.5" />
                    ) : getAssessmentType(selectedSkill) === "portfolio" ? (
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <Palette className="h-5 w-5 text-primary mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedSkill}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assessment Type:{" "}
                        {getAssessmentType(selectedSkill) === "coding"
                          ? "Coding Challenge"
                          : getAssessmentType(selectedSkill) === "portfolio"
                          ? "Portfolio Review"
                          : "Multiple Choice Questions"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level: {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleStartAssessment}
                disabled={!selectedSkill}
                className="w-full"
              >
                Start Assessment
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm font-medium">All skills assessed!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You have completed assessments for all your skills.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

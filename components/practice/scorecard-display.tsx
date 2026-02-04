"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";

interface CriterionScore {
  name: string;
  score: number;
  max_score: number;
  rationale: string;
}

interface ScorecardData {
  overall_score: number;
  criteria_scores: CriterionScore[];
  feedback: string;
}

interface ScorecardDisplayProps {
  scorecard: ScorecardData;
}

function getScoreBadge(score: number) {
  if (score >= 90) {
    return { label: "Excellent", variant: "default" as const };
  } else if (score >= 75) {
    return { label: "Good", variant: "secondary" as const };
  } else if (score >= 60) {
    return { label: "Satisfactory", variant: "outline" as const };
  } else {
    return { label: "Needs Work", variant: "destructive" as const };
  }
}

export function ScorecardDisplay({ scorecard }: ScorecardDisplayProps) {
  const scoreBadge = getScoreBadge(scorecard.overall_score);

  return (
    <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
      {/* Overall Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Overall Score</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {scorecard.overall_score.toFixed(0)}%
            </span>
            <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
          </div>
        </div>
        <Progress value={scorecard.overall_score} className="h-2" />
      </div>

      {/* Feedback */}
      {scorecard.feedback && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Feedback</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {scorecard.feedback}
          </p>
        </div>
      )}

      {/* Criteria Breakdown */}
      {scorecard.criteria_scores && scorecard.criteria_scores.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
            >
              <span className="font-semibold">
                View Detailed Breakdown ({scorecard.criteria_scores.length}{" "}
                criteria)
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              {scorecard.criteria_scores.map((criterion, idx) => {
                const percentage =
                  (criterion.score / criterion.max_score) * 100;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-background rounded-md border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{criterion.name}</h4>
                      <span className="text-sm font-semibold">
                        {criterion.score}/{criterion.max_score}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {criterion.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}




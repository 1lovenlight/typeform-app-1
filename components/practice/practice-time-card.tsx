"use client";

import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PracticeTimeChart } from "@/components/practice/practice-time-chart";
import type { PracticeStats } from "@/lib/actions/practice-actions";
import { CardHeader } from "@/components/layout/text-headers";

interface PracticeTimeCardProps {
  practiceStats: PracticeStats | null;
}

export function PracticeTimeCard({ practiceStats }: PracticeTimeCardProps) {
  const hasStats = practiceStats && practiceStats.sessionCount > 0;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card-default">
      <div className="flex flex-col gap-4 items-start justify-start p-6">
        <CardHeader
          title="Practice Time"
          actions={
            hasStats ? (
              <div className="flex flex-row items-center gap-2">
                <Badge variant="default" className="text-sm rounded-full">
                  {practiceStats.totalMinutes}m
                </Badge>
                <Badge variant="default" className="text-sm rounded-full">
                  {practiceStats.avgMinutesPerSession}m avg
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-text-secondary hover:bg-card-active"
                  asChild
                >
                  <Link href="/practice/history">
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
        />

        {!hasStats ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="h-5 w-5" />
            <p className="text-sm">
              Start your first practice session to track your progress
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <PracticeTimeChart data={practiceStats.dailyData} />
          </div>
        )}
      </div>
    </div>
  );
}

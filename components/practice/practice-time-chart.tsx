"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyPracticeData } from "@/lib/actions/practice-actions";

interface PracticeTimeChartProps {
  data: DailyPracticeData[];
}

export function PracticeTimeChart({ data }: PracticeTimeChartProps) {
  return (
    <div>
      <ChartContainer
        config={{
          minutes: {
            label: "Minutes",
            color: "hsl(var(--text-primary))",
          },
        }}
        className="min-h-[100px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-[hsl(var(--text-secondary))] [&_.recharts-cartesian-axis-tick_text]:text-xs"
      >
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 6,
            right: 6,
            top: 6,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={true}
            axisLine={true}
            tickMargin={8}
            tick={true}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            hide
            domain={[
              0,
              (dataMax: number) => Math.ceil(dataMax * 1.1), // Add 10% padding at top
            ]}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(value, payload) => {
                  // Get the date from the payload data
                  const dateValue = payload?.[0]?.payload?.date || value;
                  return new Date(dateValue).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
            }
          />
          <Area
            dataKey="minutes"
            type="linear"
            fill="var(--color-brand)"
            fillOpacity={1}
            stroke="var(--color-minutes)"
            activeDot={{
              fill: "var(--color-text-primary)",
              stroke: "var(--color-minutes)",
              strokeWidth: 2,
              r: 4,
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

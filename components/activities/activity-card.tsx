
import Link from "next/link";
import { Check, Lock, ArrowRight } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

type ActivityState = "locked" | "available" | "in_progress" | "completed";

interface ActivityCardProps {
  activity: any;
  activityState: ActivityState;
}

export function ActivityCard({ activity, activityState }: ActivityCardProps) {
  const isLocked = activityState === "locked";

  const getActivityIcon = (state: ActivityState) => {
    switch (state) {
      case "completed":
        return <Check className=" text-green-500" />;
      case "locked":
        return <Lock className="text-muted-foreground/30" />;
      case "available":
      case "in_progress":
        return <ArrowRight className="text-blue-500" />;
    }
  };

  if (isLocked) {
    return (
      <Item variant="default" className="select-none pointer-events-none">
        <ItemMedia>{getActivityIcon(activityState)}</ItemMedia>
        <ItemContent>
          <ItemTitle className="text-muted-foreground">
            {activity.display_name}
          </ItemTitle>
        </ItemContent>
      </Item>
    );
  }

  // Determine route based on activity type
  const getActivityRoute = (activityType: string | null) => {
    if (activityType === "roleplay") {
      return `/activity/roleplay/${activity.id}`;
    }
    // Default to typeform route for typeform activities or null/unknown types
    return `/activity/typeform/${activity.id}`;
  };

  return (
    <Item variant="default" asChild className="border-muted-foreground/30">
      <Link href={getActivityRoute(activity.activity_type)}>
        <ItemMedia>{getActivityIcon(activityState)}</ItemMedia>
        <ItemContent>
          <ItemTitle>{activity.display_name}</ItemTitle>
        </ItemContent>
      </Link>
    </Item>
  );
}

import { TypeformResponse } from "@/lib/actions/typeform-responses";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "@/components/ui/item";

interface RecentActivitiesProps {
  activities: TypeformResponse[];
  isLoading?: boolean;
}

export function RecentActivities({
  activities,
  isLoading = false,
}: RecentActivitiesProps) {
  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (!activities || activities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <ItemGroup className="space-y-4">
        <div className="relative">
          <ScrollArea className="h-148">
            {activities.map((activity) => (
              <div key={activity.id} className="last:pb-0">
              <ActivityItem activity={activity} />
              </div>
            ))}
          </ScrollArea>
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none z-10" />
        </div>
      </ItemGroup>
    </div>
  );
}

function ActivityItem({ activity }: { activity: TypeformResponse }) {
  // Format the date
  const date = new Date(activity.created_at);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);

  // Get form name from form_title field or fallback to default
  const formName =
    activity.form_title ||
    (activity.response &&
    typeof activity.response === "object" &&
    "title" in activity.response
      ? (activity.response.title as string)
      : "Typeform Response");

  // Check if it's a quiz
  const isQuiz = activity.form_type === "quiz";

  // Format quiz score if available
  const quizScore =
    isQuiz && activity.quiz_score !== null && activity.max_score !== null
      ? `${activity.quiz_score}/${activity.max_score}`
      : null;

  return (
    <Item variant="outline" className="w-full mb-4">
      <ItemContent>
        <ItemTitle className="flex items-center gap-2">
          {formName}
          {isQuiz && (
            <Badge variant="outline" className="text-xs">
              Quiz
            </Badge>
          )}
        </ItemTitle>
        <ItemDescription>{formattedDate}</ItemDescription>
      </ItemContent>
      {quizScore && (
        <ItemActions>
          <Badge variant="secondary" className="font-medium">
            {quizScore}
          </Badge>
        </ItemActions>
      )}
    </Item>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col gap-6">
      <ItemGroup>
        <Item variant="muted">
          <ItemContent className="text-center py-12">
            <ItemTitle className="text-muted-foreground">
              No activities yet
            </ItemTitle>
            <ItemDescription>
              Complete a form to see your activities here
            </ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Label>Recent Activities</Label>
      <ItemGroup>
        <div className="relative">
          <ScrollArea className="h-96">
            {[1, 2, 3].map((i) => (
              <Item key={i} className="last:pb-12">
                <ItemContent>
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </ItemContent>
              </Item>
            ))}
          </ScrollArea>
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none z-10" />
        </div>
      </ItemGroup>
    </div>
  );
}

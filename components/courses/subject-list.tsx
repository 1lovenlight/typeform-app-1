/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityCard } from "../activities/activity-card";
import { Item, ItemContent, ItemTitle } from "../ui/item";

type ActivityState = "locked" | "available" | "in_progress" | "completed";

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  subjects: any[];
  course_progress: any[];
}

interface SubjectListProps {
  subjects: any[];
  course: CourseData;
  completedActivities: string[];
  getActivityState: (
    activity: any,
    subject: any,
    course: CourseData,
    completedActivities: string[]
  ) => ActivityState;
}

export function SubjectList({
  subjects,
  course,
  completedActivities,
  getActivityState,
}: SubjectListProps) {
  if (!subjects || subjects.length === 0) {
    return <div />;
  }

  return (
    <div className="space-y-12">
      {subjects
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((subject: any) => (
          <div key={subject.id} className="flex flex-col gap-6">
            <div className="flex-row flex items-center justify-between">
              <div className="text-xl font-semibold">
                {subject.title}
              </div>
            </div>
            <div className="">
              {!subject.typeforms || subject.typeforms.length === 0 ? (
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle className="text-muted-foreground/50">
                      Coming Soon
                    </ItemTitle>
                  </ItemContent>
                </Item>
              ) : (
                <div className="space-y-2">
                  {subject.typeforms
                    .sort(
                      (a: any, b: any) =>
                        (a.order_index || 0) - (b.order_index || 0)
                    )
                    .map((typeform: any) => {
                      const activityState = getActivityState(
                        typeform,
                        subject,
                        course,
                        completedActivities
                      );

                      return (
                        <div key={typeform.id} className="">
                          <ActivityCard
                            key={typeform.id}
                            activity={typeform}
                            activityState={activityState}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityCard } from "../activities/activity-card";

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
    return (
      <p className="text-muted-foreground text-base py-6">
        No subjects available in this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {subjects
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((subject: any) => (
          <div
            key={subject.id}
            className="rounded-2xl bg-card/60 p-6 group/subject hover:bg-card/80 transition-colors"
          >
            <div className="mb-6">
              <h4 className="text-2xl font-semibold group-hover/subject:text-foreground transition-colors mb-2">
                {subject.title}
              </h4>
              {subject.description && (
                <p className="text-base text-muted-foreground group-hover/subject:text-muted-foreground/80 transition-colors">
                  {subject.description}
                </p>
              )}
            </div>

            {!subject.typeforms || subject.typeforms.length === 0 ? (
              <p className="text-muted-foreground text-base py-4">
                No activities available yet.
              </p>
            ) : (
              <div className="space-y-4">
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
                      <ActivityCard
                        key={typeform.id}
                        activity={typeform}
                        activityState={activityState}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import { WelcomeBackMessage } from "@/components/onboarding/onboarding-conditional";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeaderWithActions } from "@/components/layout/text-headers";
import { Badge } from "@/components/ui/badge";
import { getPracticeStats } from "@/lib/actions/practice-actions";
import { PracticeTimeCard } from "@/components/practice/practice-time-card";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";

export default async function HomePage() {
  // Get user data for personalized greeting
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get username and capitalize first letter
  const rawUsername =
    user?.user_metadata?.name?.toString() ||
    user?.user_metadata?.full_name?.toString() ||
    user?.email?.split("@")[0] ||
    "there";

  const username = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);

  // Get practice statistics
  const practiceStats = user ? await getPracticeStats(user.id) : null;

  return (
    <PageContainer>
      {/* ✅ Onboarding dialog - works in server components! */}
      <OnboardingStepDialog step="home_features" />
      {/* <OnboardingStepDialog step="home_welcome" /> */}

      <PageHeaderWithActions title={`Hey ${username}`} />

      {/* ✅ Shows welcome back message with next activity link */}

      <div className="flex flex-col gap-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WelcomeBackMessage />

          {/* <Button
            asChild
            variant="secondary"
            size="lg"
            className="text-base rounded-full font-semibold flex-1 h-12 flex flex-row items-center justify-between"
          >
            <Link href="/learn" className="w-full">
              Browse Activities
              <ChevronRightIcon />
            </Link>
          </Button> */}

          <Button
            asChild
            variant="secondary"
            size="xl"
            className="w-full rounded justify-between"
          >
            <Link href="/practice" className="w-full">
              Practice NBG
              <ChevronRightIcon />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-6">
          <PageHeaderWithActions title="Stats" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
            <PracticeTimeCard practiceStats={practiceStats} />
            <div className="w-full overflow-hidden rounded-2xl bg-card-default">
              <div className="flex flex-col gap-2 items-start justify-start p-6">
                <div className="flex flex-row items-center justify-between w-full">
                  <span className="text-2xl">Session Reviews</span>
                  <Badge
                    variant="secondary"
                    className="text-base text-text-secondary rounded-full px-4 h-10"
                  >
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

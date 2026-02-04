import { LogoutButton } from "@/components/auth/logout-button";
import {
  UsernameForm,
  ResetOnboardingForm,
  SettingsClientWrapper,
} from "@/components/settings";
import { PageContainer } from "@/components/layout/page-container";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderWithActions } from "@/components/layout/text-headers";



export default function SettingsPage() {
  return (
    <SettingsClientWrapper>
      <PageContainer className="max-w-2xl">
        <PageHeaderWithActions title="Settings" />

        {/* Settings forms */}
        <div className="flex flex-col divide-y divide-border">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <UsernameForm />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <ResetOnboardingForm />
          </Suspense>
          <LogoutButton showLayout />
        </div>
      </PageContainer>
    </SettingsClientWrapper>
  );
}

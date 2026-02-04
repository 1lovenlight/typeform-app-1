import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import SidebarMobileOnlyLayout from "@/components/tw-blocks/sidebar-layout-mobile-only";
import { CharacterProvider } from "@/lib/context/character-context";
import { UserProvider } from "@/lib/context/user-context";
import { OnboardingProvider } from "@/lib/context/onboarding-context";
import { UserProgressProvider } from "@/lib/context/user-progress-context";
import { FloatingTypeform } from "@/components/typeforms/floating-typeform";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/");
  }

  // Get user data on server to pass to provider (avoids client-side fetch)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <UserProvider
      initialUser={
        user
          ? {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata,
            }
          : null
      }
    >
      <OnboardingProvider>
        <UserProgressProvider>
          <CharacterProvider>
            <SidebarMobileOnlyLayout>
              <div className="h-full w-full">
                <div className="fixed bottom-6 right-6 z-50">
                  <FloatingTypeform />
                </div>
                {children}
              </div>
            </SidebarMobileOnlyLayout>
          </CharacterProvider>
        </UserProgressProvider>
      </OnboardingProvider>
    </UserProvider>
  );
}

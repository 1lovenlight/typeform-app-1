import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import SidebarLayout from "@/components/tw-blocks/sidebar-layout";
import { CharacterProvider } from "@/lib/context/character-context";
import { UserProvider } from "@/lib/context/user-context";

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
      <CharacterProvider>
        <SidebarLayout>{children}</SidebarLayout>
      </CharacterProvider>
    </UserProvider>
  );
}

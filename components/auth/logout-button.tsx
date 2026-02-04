"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  showLayout?: boolean;
}

export function LogoutButton({ showLayout = false }: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const button = (
    <Button variant="brand" className="w-full" onClick={logout}>
      Logout
    </Button>
  );

  if (showLayout) {
    return (
      <div className="flex flex-row gap-12 w-full items-start justify-between py-12">
        <div className="flex-1 flex-col gap-1">
          <h2 className="text-text-primary text-2xl">Log out</h2>
        </div>
        <div className="flex-1 w-full flex justify-end">{button}</div>
      </div>
    );
  }

  return button;
}

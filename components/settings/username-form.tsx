"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/context/user-context";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import { SubHeader } from "../layout/text-headers";

export function UsernameForm() {
  const [isLoading, setIsLoading] = useState(false);

  // Get user from provider
  const { user, loading: isLoadingUser } = useUser();
  const [username, setUsername] = useState("");

  // Set initial username from provider when available
  useEffect(() => {
    if (user && !username) {
      const currentUsername =
        user.user_metadata?.username?.toString() ||
        user.user_metadata?.name?.toString() ||
        "";
      setUsername(currentUsername);
    }
  }, [user, username]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);

    if (!username.trim()) {
      toast.error("Username cannot be empty");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: username.trim(),
          username: username.trim(),
        },
      });
      if (error) throw error;

      toast.success("Username updated successfully!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      toast.error("Failed to update username", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row gap-12 w-full items-start justify-between py-12">
      <div className="flex-1 flex-col gap-1">
        <SubHeader
          title="Username"
          description="Update your username. This is how you'll be addressed by the AI and throughout the app."
        />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <form onSubmit={handleUpdateUsername} className="flex-1 w-full">
          <InputGroup className="w-full">
            <InputGroupInput
              id="username"
              type="text"
              placeholder="johndoe"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || isLoadingUser}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                variant="brand"
                disabled={isLoading || isLoadingUser}
              >
                {isLoading ? <Spinner className="size-3.5" /> : "Update"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </Suspense>
    </div>
  );
}

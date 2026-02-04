"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserContextValue {
  user: User | null;
  userId: string | null;
  userName: string;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

interface InitialUserData {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: InitialUserData | null;
}) {
  const [user, setUser] = useState<User | null>(
    initialUser as User | null
  );
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    // Skip client fetch if we have server-provided data
    if (initialUser) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, [initialUser]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userName =
    user?.user_metadata?.name?.toString() ||
    user?.user_metadata?.full_name?.toString() ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <UserContext.Provider
      value={{
        user,
        userId: user?.id ?? null,
        userName,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

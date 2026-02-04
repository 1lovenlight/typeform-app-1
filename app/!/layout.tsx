"use client";

import { ReactNode } from "react";

import { UserProvider } from "@/lib/context/user-context";

export default function DevLayout({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

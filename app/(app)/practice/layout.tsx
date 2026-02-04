"use client";

import { usePathname } from "next/navigation";
import { ResponsiveWrapper } from "@/components/layout/responsive-warning";
import { CharacterProvider } from "@/lib/context/character-context";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHistoryPage = pathname === "/practice/history";

  const content = <CharacterProvider>{children}</CharacterProvider>;

  // Only wrap with ResponsiveWrapper if NOT on history page
  if (isHistoryPage) {
    return content;
  }

  return (
    <ResponsiveWrapper minWidth={768} minHeight={768}>
      {content}
    </ResponsiveWrapper>
  );
}

import { type ReactNode } from "react";

export function AuthPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 sm:pt-32 lg:px-8 h-full">
      {children}
    </div>
  );
}

export function AppPageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl p-6 lg:p-8 h-full">{children}</div>;
}

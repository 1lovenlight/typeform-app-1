"use client";

import { useEffect, useState } from "react";

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  title?: string;
  message?: string;
}

export function ResponsiveWrapper({
  children,
  minWidth = 1440,
  minHeight = 768,
  title = "Screen too small",
}: ResponsiveWrapperProps) {
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Show warning if width or height requirements not met
      setShowMobileWarning(width < minWidth || height < minHeight);
    };

    // Check on mount
    checkScreenSize();

    // Check on resize
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [minWidth, minHeight]);

  return (
    <div className="relative h-full w-full">
      {/* Children always rendered - keeps Typeform widget mounted */}
      <div
        className={`h-full w-full ${
          showMobileWarning ? "pointer-events-none" : ""
        }`}
      >
        {children}
      </div>

      {/* Overlay warning - blocks interaction but doesn't unmount children */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-1/90">
          <div className="text-2xl">{title}</div>
        </div>
      )}
    </div>
  );
}

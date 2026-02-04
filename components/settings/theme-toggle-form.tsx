"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ThemeToggleForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle theme mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Light</span>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <span className="text-sm text-muted-foreground">Dark</span>
    </div>
  );
}


















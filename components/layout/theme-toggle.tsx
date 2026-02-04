"use client";

import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    mounted && (
      <div className="flex items-center justify-center">
        <Field orientation="horizontal">
          <FieldLabel>
            <Sun className="size-4 text-text-secondary" />
          </FieldLabel>
          <FieldContent>
            <div className="flex items-center justify-center">
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </FieldContent>
        </Field>
      </div>
    )
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Settings, Sun, Moon } from "lucide-react";

interface SettingsMenuProps {
  userEmail?: string | null;
}

export function SettingsMenu({ userEmail }: SettingsMenuProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleThemeToggle = () => {
    setTheme(
      typeof window !== "undefined" &&
        document.documentElement.classList.contains("dark")
        ? "light"
        : "dark"
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
        >
          <Settings className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleThemeToggle}>
          <div className="flex items-center justify-between w-full">
            <span>Switch Theme</span>
            <div className="relative">
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute inset-0 size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

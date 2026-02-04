"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  ChevronDown,
  User,
  LogOut,
  ChevronsUpDown,
  Sun,
  Moon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemMedia,
  ItemActions,
} from "@/components/ui/item";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

const navigationItems = [
  {
    title: "Learn",
    items: [
      {
        title: "Home",
        url: "/home",
      },
      {
        title: "Courses",
        url: "/courses",
      },
    ],
  },
  {
    title: "Typeforms",
    items: [
      {
        title: "Manage",
        url: "/manage",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleThemeToggle = () => {
    setTheme(
      typeof window !== "undefined" &&
        document.documentElement.classList.contains("dark")
        ? "light"
        : "dark"
    );
  };

  React.useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUserEmail(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="text-base font-medium"
                    >
                      <Link href={item.url}>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Item
                  variant="outline"
                  className="w-full cursor-pointer hover:bg-muted border-muted-foreground/30"
                >
                  <ItemContent>
                    <ItemTitle className="text-sm font-normal">
                      {loading ? "Loading..." : userEmail || "User Profile"}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronsUpDown className="size-4 text-muted-foreground" />
                  </ItemActions>
                </Item>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Signed in as
                    </p>
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
                <DropdownMenuItem onClick={handleLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

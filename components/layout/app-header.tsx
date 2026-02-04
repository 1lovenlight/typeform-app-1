import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  userEmail?: string | null;
  isLoggedIn: boolean;
}

export function AppHeader({ userEmail, isLoggedIn }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b h-12 w-full p-4">
      <SidebarTrigger className="text-muted-foreground"/>
    </div>
  );
}

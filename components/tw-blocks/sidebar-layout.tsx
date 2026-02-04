"use client";

import { useState, type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/layout/theme-toggle";

const navigationItems = [
  { name: "Home", href: "/home" },
  { name: "Learn", href: "/learn" },
  { name: "Practice", href: "/practice" },
  { name: "Settings", href: "/settings" },
  // { name: "Chat", href: "/chat" },
];

const adminNavigationItems: Array<{ name: string; href: string }> = [
  { name: "Characters", href: "/admin/characters" },
  { name: "Manage", href: "/admin/manage" },
];

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = { name: string; href: string; current: boolean };

function NavLink({ item }: { item: NavItem }) {
  return (
    <li>
      <a
        href={item.href}
        className={classNames(
          item.current
            ? "bg-card-active text-text-primary text-2xl"
            : "hover:bg-card-hover hover:text-text-primary text-text-secondary text-2xl",
          "group flex gap-x-3 rounded-md p-2"
        )}
      >
        {item.name}
      </a>
    </li>
  );
}

function Logo() {
  return (
    <div className="flex h-16 shrink-0 items-center">
      <img alt="Relationship Hero" src="/rhThumb.png" className="h-8 w-auto" />
    </div>
  );
}

function NavigationSection({
  navigation,
  adminNavigation,
}: {
  navigation: NavItem[];
  adminNavigation: NavItem[];
}) {
  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
            {adminNavigation.length > 0 && (
              <>
                <p className="text-text-secondary text-sm font-medium mt-12">
                  Admin
                </p>
                {adminNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </>
            )}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

function SidebarContent({
  navigation,
  adminNavigation,
}: {
  navigation: NavItem[];
  adminNavigation: NavItem[];
}) {
  return (
    <>
      <Logo />
      <NavigationSection
        navigation={navigation}
        adminNavigation={adminNavigation}
      />
    </>
  );
}

export default function SidebarLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const mapNavItems = (items: Array<{ name: string; href: string }>) =>
    items.map((item) => ({
      ...item,
      current: pathname === item.href || pathname.startsWith(`${item.href}/`),
    }));

  const navigation = useMemo(() => mapNavItems(navigationItems), [pathname]);

  const adminNavigation = useMemo(
    () => mapNavItems(adminNavigationItems),
    [pathname]
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Mobile Sidebar Dialog */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 2xl:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-background-1/90 transition-opacity duration-100 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-100 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 ease-in-out data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon
                    aria-hidden="true"
                    className="size-6 text-primary"
                  />
                </button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-background-1 px-4 pb-2">
              <SidebarContent
                navigation={navigation}
                adminNavigation={adminNavigation}
              />
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop Sidebar */}
      <div className="hidden 2xl:fixed 2xl:inset-y-0 2xl:z-50 2xl:flex 2xl:w-72 2xl:flex-col transition-all duration-500 ease-in-out">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background-1 px-6 transition-all duration-500 ease-in-out">
          <SidebarContent
            navigation={navigation}
            adminNavigation={adminNavigation}
          />
          <div className="flex w-full items-center justify-end h-16">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-x-6 px-4 py-4 2xl:hidden h-16">
        <div className="flex flex-row w-full gap-x-4 items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-primary 2xl:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <main className="2xl:pl-78 flex-1 w-full overflow-auto">
        <div className="py-5 px-6 2xl:p-12 h-full">{children}</div>
      </main>
    </div>
  );
}

import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "../ui/drawer";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Label } from "../ui/label";

export function NavigationMenu() {
  return (
    <Drawer direction="left">
      <DrawerTrigger>
        <Menu className="size-5 text-muted-foreground" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex justify-between items-center">
            <DrawerTitle className="text-sm font-normal">
              Navigation
            </DrawerTitle>
            <DrawerClose>
              <X />
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="px-4 flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="home"
              className="text-muted-foreground font-normal text-xs"
            >
              Learn
            </Label>
            <DrawerClose asChild>
              <Button
                asChild
                variant="link"
                className="justify-start text-sm font-normal"
              >
                <Link href="/home">Home</Link>
              </Button>
            </DrawerClose>

            <DrawerClose asChild>
              <Button
                asChild
                variant="link"
                className="justify-start text-sm font-normal"
              >
                <Link href="/home">Lessons</Link>
              </Button>
            </DrawerClose>
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="home"
              className="text-muted-foreground font-normal text-xs"
            >
              Manage
            </Label>
            <DrawerClose asChild>
              <Button
                asChild
                variant="link"
                className="justify-start text-sm font-normal"
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </DrawerClose>

            <DrawerClose asChild>
              <Button
                asChild
                variant="link"
                className="justify-start text-sm font-normal"
              >
                <Link href="/manage">Manage Typeforms</Link>
              </Button>
            </DrawerClose>
          </div>
        </div>
        <DrawerFooter></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

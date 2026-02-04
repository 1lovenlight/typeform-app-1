"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ActivityInfoDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground cursor-pointer"
        >
          Hint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activity Information</DialogTitle>
          <DialogDescription>
            Learn more about this activity and how to complete it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is placeholder content for the activity information dialog. You
            can add details about the activity, instructions, tips, or any other
            relevant information here.
          </p>
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Quick Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Take your time to read each question carefully</li>
              <li>You can navigate back to previous questions</li>
              <li>Your progress is automatically saved</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

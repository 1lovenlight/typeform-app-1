"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteUserProgressButtonProps {
  userId: string;
  onSuccess?: () => void;
}

export function DeleteUserProgressButton({
  userId,
  onSuccess,
}: DeleteUserProgressButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Delete from all three progress tables
      const [userProgressResult, courseProgressResult, moduleProgressResult] = await Promise.all([
        supabase.from("user_progress").delete().eq("user_id", userId),
        supabase.from("course_progress").delete().eq("user_id", userId),
        supabase.from("module_progress").delete().eq("user_id", userId),
      ]);

      // Check for errors
      const errors = [
        { table: "user_progress", error: userProgressResult.error },
        { table: "course_progress", error: courseProgressResult.error },
        { table: "module_progress", error: moduleProgressResult.error },
      ].filter((item) => item.error);

      if (errors.length > 0) {
        const errorMessages = errors.map((e) => `${e.table}: ${e.error?.message}`).join(", ");
        console.error("Error deleting progress records:", errors);
        toast.error("Failed to delete some progress records", {
          description: errorMessages,
        });
        return;
      }

      toast.success("All progress records deleted successfully");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting progress records:", error);
      toast.error("Failed to delete progress records", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={loading}>
          <Trash2 className="size-4" />
          Delete Progress
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Progress Records?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your progress records from the
            user_progress, course_progress, and module_progress tables. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


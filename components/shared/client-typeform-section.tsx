"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import TypeformEmbed from "@/components/typeforms/typeform-embed";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { MailQuestionMark } from "lucide-react";

type Typeform = Tables<"activities">;

interface ClientTypeformSectionProps {
  defaultFormId: string;
  formId?: string;
  additionalHiddenFields?: Record<string, string>;
  showSelector?: boolean;
}

export function ClientTypeformSection({
  defaultFormId,
  formId,
  additionalHiddenFields = {},
  showSelector = true,
}: ClientTypeformSectionProps) {
  const { userId } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get form ID from URL params, props, or default
  const urlFormId = searchParams.get("embed_id");
  const initialFormId = urlFormId || formId || defaultFormId;

  const [availableForms, setAvailableForms] = useState<Typeform[]>([]);
  const [selectedFormId, setSelectedFormId] = useState(initialFormId);
  const [loading, setLoading] = useState(true);
  const [hintDialogOpen, setHintDialogOpen] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  // Load available typeforms from Supabase
  useEffect(() => {
    const loadTypeforms = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("display_name");

        if (error) {
          console.error("Error loading typeforms:", error);
          return;
        }

        setAvailableForms(data || []);
      } catch (error) {
        console.error("Error loading typeforms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTypeforms();
  }, []);

  // Update the form when the formId prop or URL param changes
  useEffect(() => {
    const newFormId = urlFormId || formId || defaultFormId;
    if (newFormId !== selectedFormId) {
      setSelectedFormId(newFormId);
    }
  }, [formId, urlFormId, defaultFormId, selectedFormId]);

  // Force remount when pathname changes
  useEffect(() => {
    // Reset any state or force reinitialization when pathname changes
    if (scriptLoaded.current && window.tf) {
      window.tf.load();
    }
  }, [pathname]);

  // Use a ref to track if the script has been loaded
  const scriptLoaded = useRef(false);
  const handleScriptLoad = () => {
    scriptLoaded.current = true;
  };

  // Handle form selection and update URL
  const handleFormSelect = (newFormId: string) => {
    setSelectedFormId(newFormId);

    // Small delay to ensure state updates before URL change
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("embed_id", newFormId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 10);
  };

  // Fetch hint for the current form
  const fetchHint = async () => {
    if (!selectedFormId) return;

    setHintLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activities")
        .select("hint, display_name")
        .eq("embed_id", selectedFormId)
        .single();

      if (error) {
        console.error("Error fetching hint:", error);
        setCurrentHint("Unable to load hint at this time.");
        setHintDialogOpen(true);
        return;
      }

      setCurrentHint(data?.hint || "No hint available for this form.");
      setHintDialogOpen(true);
    } catch (error) {
      console.error("Error fetching hint:", error);
      setCurrentHint("Unable to load hint at this time.");
      setHintDialogOpen(true);
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Typeform Selector */}
      {showSelector && availableForms.length > 1 && !loading && (
        <div className="flex flex-row justify-between items-center">
          <Select value={selectedFormId} onValueChange={handleFormSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              {availableForms.map((form) => (
                <SelectItem key={form.embed_id || form.id} value={form.embed_id || form.id}>
                  {form.display_name}
                  {form.is_quiz && " (Quiz)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={fetchHint}
            disabled={hintLoading}
          >
            <MailQuestionMark className="size-4.5" />
          </Button>
        </div>
      )}

      {/* Show hint button even when there's only one form */}
      {(!showSelector || availableForms.length <= 1) && !loading && (
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={fetchHint}
            disabled={hintLoading}
          >
            <MailQuestionMark className="size-4.5" />
          </Button>
        </div>
      )}

      {/* Typeform Embed */}
      <div className="w-full rounded-2xl">
        {/* Use key with pathname and selectedFormId to force remount on changes */}
        <TypeformEmbed
          key={`typeform-${pathname}-${selectedFormId}`}
          formId={selectedFormId}
          userId={userId}
          hiddenFields={additionalHiddenFields}
          onScriptLoad={handleScriptLoad}
        />
      </div>

      {/* Hint Dialog */}
      <Dialog open={hintDialogOpen} onOpenChange={setHintDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {availableForms.find((form) => form.embed_id === selectedFormId)
                ?.display_name || "Form Hint"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {hintLoading ? (
              <p className="text-muted-foreground">Loading hint...</p>
            ) : currentHint ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{currentHint}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hint available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

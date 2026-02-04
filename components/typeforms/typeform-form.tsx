"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { createTypeform, updateTypeform } from "@/lib/actions/typeform-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Typeform = Tables<"activities">;

interface TypeformFormProps {
  typeform?: Typeform;
  onSuccess: () => void;
}

export function TypeformForm({ typeform, onSuccess }: TypeformFormProps) {
  const [formData, setFormData] = useState({
    internal_name: typeform?.internal_name || "",
    display_name: typeform?.display_name || "",
    embed_id: typeform?.embed_id || "",
    form_id: typeform?.form_id || "",
    category: typeform?.category || "",
    short_description: typeform?.short_description || "",
    is_quiz: typeform?.is_quiz || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmbedIdWarning, setShowEmbedIdWarning] = useState(false);
  const [pendingEmbedId, setPendingEmbedId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (typeform) {
        // Update existing typeform
        await updateTypeform(typeform.id, formData);
      } else {
        // Create new typeform
        await createTypeform(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Special handling for embed_id changes on existing typeforms
    if (name === "embed_id" && typeform && value !== typeform.embed_id) {
      setPendingEmbedId(value);
      setShowEmbedIdWarning(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_quiz: checked,
    }));
  };

  const handleEmbedIdConfirm = () => {
    setFormData((prev) => ({ ...prev, embed_id: pendingEmbedId }));
    setShowEmbedIdWarning(false);
    setPendingEmbedId("");
  };

  const handleEmbedIdCancel = () => {
    setShowEmbedIdWarning(false);
    setPendingEmbedId("");
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full mx-auto">
        <div>
          <Label>{typeform ? "Edit Typeform" : "Create New Typeform"}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {typeform ? "Update details below" : "Complete details below"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="internal_name">Internal Name</FieldLabel>
              <Input
                id="internal_name"
                name="internal_name"
                value={formData.internal_name}
                onChange={handleInputChange}
                placeholder="Enter internal name"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="display_name">Display Name</FieldLabel>
              <Input
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Enter display name"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="embed_id">Embed ID</FieldLabel>
              {typeform && (
                <FieldDescription className="text-xs text-destructive">
                  Changing this may break existing links
                </FieldDescription>
              )}

              <Input
                id="embed_id"
                name="embed_id"
                value={formData.embed_id}
                onChange={handleInputChange}
                placeholder="Enter Typeform embed ID"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="form_id">Form ID (SDK)</FieldLabel>
              <FieldDescription className="text-xs text-muted-foreground">
                Required for React SDK integration. Get this from your Typeform
                URL or API.
              </FieldDescription>

              <Input
                id="form_id"
                name="form_id"
                value={formData.form_id}
                onChange={handleInputChange}
                placeholder="Enter Typeform form ID for SDK"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Enter category (optional)"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="short_description">
                Description
              </FieldLabel>
              <textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="Enter description (optional)"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
              />
            </Field>

            <Field>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_quiz"
                  checked={formData.is_quiz}
                  onCheckedChange={handleCheckboxChange}
                />
                <FieldLabel htmlFor="is_quiz">This is a quiz</FieldLabel>
              </div>
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : typeform
                  ? "Update Typeform"
                  : "Create Typeform"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>

      {/* Embed ID Change Warning Dialog */}
      <Dialog open={showEmbedIdWarning} onOpenChange={setShowEmbedIdWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Embed ID Change
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to change the Embed ID from{" "}
              <code className="bg-muted px-1 rounded">
                {typeform?.embed_id}
              </code>{" "}
              to <code className="bg-muted px-1 rounded">{pendingEmbedId}</code>
              .
              <br />
              <br />
              <strong>Warning:</strong> This change may:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Break existing links to this typeform</li>
                <li>Disconnect previous response data</li>
                <li>Affect analytics and tracking</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleEmbedIdCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEmbedIdConfirm}>
              Yes, Change Embed ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

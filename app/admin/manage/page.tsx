"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { TypeformReactWidget } from "@/components/typeforms/typeform-react-widget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TypeformForm } from "@/components/typeforms/typeform-form";
import { DeleteUserProgressButton } from "@/components/shared/delete-user-progress-button";

type Typeform = Tables<"activities">;

export default function ManagePage() {
  const [typeforms, setTypeforms] = useState<Typeform[]>([]);
  const [selectedTypeform, setSelectedTypeform] = useState<Typeform | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchTypeforms() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("display_name");

        if (error) {
          console.error("Error fetching typeforms:", error);
          return;
        }

        const forms = data || [];
        setTypeforms(forms);
        // Auto-select first form with form_id if available
        if (forms.length > 0 && !selectedTypeform) {
          const firstWithFormId = forms.find((form) => form.form_id);
          if (firstWithFormId) {
            setSelectedTypeform(firstWithFormId);
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTypeforms();
  }, [selectedTypeform]);

  const refreshTypeforms = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("display_name");

    const forms = data || [];
    setTypeforms(forms);

    // Update the selected typeform with fresh data if it exists
    if (selectedTypeform) {
      const updatedSelectedForm = forms.find(
        (f) => f.id === selectedTypeform.id
      );
      if (updatedSelectedForm) {
        setSelectedTypeform(updatedSelectedForm);
      }
    }

    // If we don't have a selected form, select the first one with form_id
    if (!selectedTypeform && forms.length > 0) {
      const firstWithFormId = forms.find((form) => form.form_id);
      if (firstWithFormId) {
        setSelectedTypeform(firstWithFormId);
      }
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refreshTypeforms();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    refreshTypeforms();
  };

  const handleTypeformSelect = (formId: string) => {
    const form = typeforms.find((f) => f.form_id === formId);
    if (form) {
      setSelectedTypeform(form);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col max-w-2xl w-full h-full mx-auto px-6 gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Manage</h2>
          <Button disabled variant="outline">
            <Plus />
            Create New
          </Button>
        </div>
        <Item variant="outline" className="rounded-2xl h-72">
          <ItemContent>
            <div className="animate-pulse"></div>
          </ItemContent>
        </Item>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-2xl w-full h-full mx-auto px-6 pb-6 gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Typeforms</h2>
        <div className="flex items-center gap-2">
          {userId && (
            <DeleteUserProgressButton
              userId={userId}
              onSuccess={() => {
                // Optionally refresh data or show success message
              }}
            />
          )}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus />
                Create New
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full overflow-y-auto">
              <DialogHeader className="sr-only">
                <DialogTitle>Create New Typeform</DialogTitle>
              </DialogHeader>
              <TypeformForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {typeforms.length === 0 ? (
        <Item variant="outline" className="rounded-2xl">
          <ItemContent>
            <ItemTitle>No typeforms found</ItemTitle>
            <ItemDescription>
              Create your first typeform to get started with managing content.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Create First Form
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full">
                <DialogHeader className="sr-only">
                  <DialogTitle>Create New Typeform</DialogTitle>
                </DialogHeader>
                <TypeformForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </ItemActions>
        </Item>
      ) : typeforms.filter((form) => form.form_id).length === 0 ? (
        <Item variant="outline" className="rounded-2xl">
          <ItemContent>
            <ItemTitle>No SDK-compatible forms found</ItemTitle>
            <ItemDescription>
              Add form_id values to your existing typeforms to use the React SDK
              preview.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Create New Form
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full">
                <DialogHeader className="sr-only">
                  <DialogTitle>Create New Typeform</DialogTitle>
                </DialogHeader>
                <TypeformForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </ItemActions>
        </Item>
      ) : (
        <div className="flex flex-col h-full gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between p-6 border rounded-2xl">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {selectedTypeform?.display_name || "Select a Typeform"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedTypeform?.short_description ||
                  "Choose a typeform to preview and manage"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedTypeform?.form_id || ""}
                onValueChange={handleTypeformSelect}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select typeform" />
                </SelectTrigger>
                <SelectContent>
                  {typeforms
                    .filter((form) => form.form_id)
                    .map((form) => (
                      <SelectItem key={form.form_id} value={form.form_id!}>
                        {form.display_name}
                        {form.is_quiz && " (Quiz)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedTypeform && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="size-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogHeader className="sr-only">
                    <DialogTitle>Edit Typeform</DialogTitle>
                  </DialogHeader>
                  <DialogContent className="w-full">
                    <TypeformForm
                      typeform={selectedTypeform}
                      onSuccess={handleEditSuccess}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Typeform Widget Section */}
          {selectedTypeform && selectedTypeform.form_id && (
            <div className="flex-1 rounded-3xl overflow-hidden">
              <TypeformReactWidget
                key={selectedTypeform.form_id}
                formId={selectedTypeform.form_id}
                hiddenFields={{
                  preview_mode: "true",
                  typeform_id: selectedTypeform.id,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

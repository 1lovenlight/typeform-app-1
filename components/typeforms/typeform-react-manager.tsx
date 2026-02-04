"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TypeformReactWidget } from "./typeform-react-widget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
} from "@/components/ui/item";

interface Typeform {
  id: string;
  embed_id: string;
  form_id: string | null;
  display_name: string;
  short_description: string | null;
  is_quiz: boolean;
}

interface TypeformReactManagerProps {
  userId?: string | null;
  hiddenFields?: Record<string, string>;
}

export function TypeformReactManager({
  userId,
  hiddenFields = {},
}: TypeformReactManagerProps) {
  const [typeforms, setTypeforms] = useState<Typeform[]>([]);
  const [selectedTypeform, setSelectedTypeform] = useState<Typeform | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load typeforms from database
  useEffect(() => {
    async function loadTypeforms() {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("display_name");

        if (error) {
          console.error("Error loading typeforms:", error);
          return;
        }

        setTypeforms(data || []);

        // Auto-select first typeform with form_id
        const firstWithFormId = data?.find((tf) => tf.form_id);
        if (firstWithFormId) {
          setSelectedTypeform(firstWithFormId);
        }
      } catch (error) {
        console.error("Error loading typeforms:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTypeforms();
  }, [supabase]);

  const handleTypeformSelect = (formId: string) => {
    const typeform = typeforms.find((tf) => tf.form_id === formId);
    setSelectedTypeform(typeform || null);
  };

  // Prepare hidden fields
  const allHiddenFields = { ...hiddenFields };
  if (userId) {
    allHiddenFields.user_id = userId;
  }
  if (selectedTypeform) {
    allHiddenFields.typeform_id = selectedTypeform.id;
  }

  if (loading) {
    return (
      <Item variant="muted" className="rounded-3xl">
        <ItemContent>
          <ItemTitle>Loading typeforms...</ItemTitle>
          <ItemDescription>
            Please wait while we fetch your forms.
          </ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  // Filter typeforms that have form_id (React SDK compatible)
  const reactSdkTypeforms = typeforms.filter((tf) => tf.form_id);

  if (reactSdkTypeforms.length === 0) {
    return (
      <Item variant="muted" className="rounded-3xl">
        <ItemContent>
          <ItemTitle>No React SDK compatible forms found</ItemTitle>
          <ItemDescription>
            Add form_id values to your typeforms to use the React SDK embed.
          </ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <div className="w-full h-full">
    <Item variant="muted" className="rounded-3xl h-full">
      <ItemHeader>
        <ItemContent>
          <ItemTitle>
            {selectedTypeform?.display_name || "Select a Typeform"}
          </ItemTitle>
          <ItemDescription>
            {selectedTypeform?.short_description ||
              "Choose a typeform to preview with React SDK"}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select
            value={selectedTypeform?.form_id || ""}
            onValueChange={handleTypeformSelect}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select typeform" />
            </SelectTrigger>
            <SelectContent>
              {reactSdkTypeforms.map((form) => (
                <SelectItem key={form.form_id} value={form.form_id!}>
                  {form.display_name}
                  {form.is_quiz && " (Quiz)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ItemActions>
      </ItemHeader>

      {selectedTypeform && selectedTypeform.form_id && (
        <div className="w-full h-full">
          <TypeformReactWidget
            formId={selectedTypeform.form_id}
            userId={userId}
            hiddenFields={allHiddenFields}
          />
          </div>
        )}
      </Item>
    </div>
  );
}

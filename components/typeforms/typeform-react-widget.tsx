"use client";

import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Widget } from "@typeform/embed-react";

interface TypeformReactWidgetProps {
  formId: string;
  userId?: string | null;
  hiddenFields?: Record<string, string>;
  className?: string;
  useAspectRatio?: boolean;
}

export function TypeformReactWidget({
  formId,
  userId,
  hiddenFields = {},
  className,
  useAspectRatio = true,
}: TypeformReactWidgetProps) {
  // Validate formId
  if (!formId || typeof formId !== "string") {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-secondary">
        <p>Form ID is missing or invalid</p>
      </div>
    );
  }

  // Prepare hidden fields
  const allHiddenFields = { ...hiddenFields };
  if (userId) {
    allHiddenFields.user_id = userId;
  }

  const widgetContainerStyle = {
    width: "100%",
    height: "100%",
  };

  const widget = (
    <Widget
      id={formId}
      style={widgetContainerStyle}
      hidden={allHiddenFields}
      lazy={false}
      autoResize={!useAspectRatio}
    />
  );

  if (useAspectRatio) {
    return (
      <div className={`w-full rounded-2xl overflow-clip ${className || ""}`}>
        <AspectRatio ratio={2 / 1}>{widget}</AspectRatio>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full rounded-2xl overflow-hidden ${className || ""}`}
      style={{
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className="w-full h-full"
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Typeform widget creates an iframe that handles its own scrolling */}
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          {widget}
        </div>
      </div>
    </div>
  );
}

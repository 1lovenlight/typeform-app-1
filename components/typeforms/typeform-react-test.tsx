"use client";

import { Widget } from "@typeform/embed-react";

interface TypeformReactTestProps {
  formId: string;
  hiddenFields?: Record<string, string>;
  userId?: string | null;
}

export function TypeformReactTest({ formId }: TypeformReactTestProps) {
  console.log("Testing with formId:", formId);

  return (
    <div className="w-full h-full">
      <Widget
        id="jj8KauGK"
        style={{
          width: "100%",
          height: "100%",
        }}
        className="typeform-widget"
      />
    </div>
  );
}

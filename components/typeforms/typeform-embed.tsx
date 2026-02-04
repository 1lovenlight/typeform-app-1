"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Add TypeForm global type
declare global {
  interface Window {
    tf: {
      load: () => void;
    };
  }
}

interface TypeformEmbedProps {
  formId: string;
  hiddenFields?: Record<string, string>;
  userId?: string | null;
  onScriptLoad?: () => void;
}

export default function TypeformEmbed({
  formId = "01K662E9MKDY8TT2M56V1QS7RA",
  hiddenFields = {},
  userId,
  onScriptLoad,
}: TypeformEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Check if script is already loaded on mount
  useEffect(() => {
    if (window.tf && !scriptLoaded.current) {
      scriptLoaded.current = true;
      if (onScriptLoad) {
        onScriptLoad();
      }
    }
  }, [onScriptLoad]);

  // Prepare hidden fields
  const allHiddenFields = { ...hiddenFields };
  if (userId) {
    allHiddenFields.user_id = userId;
  }

  // Convert hidden fields to data attribute format
  const hiddenFieldsString = Object.entries(allHiddenFields)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");

  // This effect handles initializing and re-rendering the form when formId or hidden fields change
  useEffect(() => {
    // Try to load the form whenever formId changes, regardless of scriptLoaded state
    // This handles cases where the script was already loaded before component mounted
    if (containerRef.current && window.tf) {
      window.tf.load();
    }
  }, [formId, hiddenFieldsString]);

  // Mark script as loaded and trigger initial load
  const handleScriptLoad = () => {
    scriptLoaded.current = true;
    if (onScriptLoad) {
      onScriptLoad();
    }
    // Trigger initial load after script is ready
    if (window.tf) {
      window.tf.load();
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div
        data-tf-live={formId}
        data-tf-hidden={hiddenFieldsString || undefined}
        data-tf-auto-resize="500,2000"
        className="w-full"
      ></div>
      <Script
        src="//embed.typeform.com/next/embed.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
    </div>
  );
}

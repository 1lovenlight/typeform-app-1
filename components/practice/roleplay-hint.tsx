"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Cluely from "./cluely";
import { useCharacter } from "@/lib/context/character-context";

const tabs = [
  // { name: "Hints", id: "hints" },
  { name: "Scripts", id: "scripts", default: true },
];

const RoleplayHint: React.FC = () => {
  const { selectedCharacter } = useCharacter();

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="overflow-hidden rounded-3xl bg-background-2 flex flex-col h-full min-h-0">
        <div className="flex flex-col p-4">
          {/* Card Header */}
          <h2 className="text-base font-semibold text-text-primary">
            NBG Assistant
          </h2>
          <p className="text-sm text-text-secondary">
            Tap buttons below to generate client-specific NBG
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          {/* Card Body */}
          <div className="h-full overflow-y-auto">
            <div className="h-full">
              <Cluely key={selectedCharacter?.id || "no-character"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayHint;

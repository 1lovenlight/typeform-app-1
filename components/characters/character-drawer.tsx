"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Tables } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "../ui/spinner";

type Character = Tables<"characters">;

interface CharacterDrawerProps {
  character?: Character;
  open: boolean;
  onClose: () => void;
}

const tabs = [
  { name: "View", id: "view" },
  { name: "Edit", id: "edit" },
];

function classNames(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

// Helper functions for JSONB data
const parseJsonb = function <T>(data: unknown): T | null {
  try {
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data as T;
  } catch {
    return null;
  }
};

interface TopicItem {
  topic: string;
  priority: number;
  nbg_phase: string;
}

const KeyTopicsDisplay = ({ topics }: { topics: TopicItem[] }) => {
  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return "bg-red-100 text-red-800";
    if (priority >= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "any":
        return "bg-blue-100 text-blue-800";
      case "booking":
        return "bg-purple-100 text-purple-800";
      case "future_work":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">
        Key Topics ({topics.length})
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {topics.map((topic, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-gray-900 flex-1">
                {topic.topic}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                <Badge className={getPriorityColor(topic.priority)}>
                  P{topic.priority}
                </Badge>
                <Badge className={getPhaseColor(topic.nbg_phase)}>
                  {topic.nbg_phase.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CharacterDrawer({
  character,
  open,
  onClose,
}: CharacterDrawerProps) {
  const [activeTab, setActiveTab] = useState("view");
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0" />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                <div className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-row items-center gap-4">
                      <DialogTitle className="text-base font-semibold text-gray-900">
                        {character
                          ? `${character.character_name}`
                          : "Character Details"}
                      </DialogTitle>
                      <div className="px-4">
                        <nav className="flex space-x-6">
                          {tabs.map((tab) => (
                            <button
                              key={tab.name}
                              onClick={() => setActiveTab(tab.id)}
                              className={classNames(
                                activeTab === tab.id
                                  ? "border-primary text-primary"
                                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "border-b-2 px-1 text-sm font-medium whitespace-nowrap"
                              )}
                            >
                              {tab.name}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={onClose}
                        className="relative rounded-md text-gray-400 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative mt-3 border-t border-gray-200 flex-1 overflow-y-auto">
                  {character ? (
                    <div className="h-full">
                      {activeTab === "view" && (
                        <div className="flex flex-col">
                          <div className="relative">
                            {character.profile_image_url ? (
                              <img
                                alt=""
                                src={character.profile_image_url}
                                className="size-full object-cover h-[500px]"
                              />
                            ) : (
                              <div className="size-full bg-gray-200 flex items-center justify-center h-[500px]">
                                <div className="text-gray-400 text-4xl font-semibold">
                                  {character.character_name
                                    ?.split(" ")
                                    ?.map((word) => word[0])
                                    ?.join("")
                                    ?.toUpperCase() || "?"}
                                </div>
                              </div>
                            )}
                          </div>
                          <pre className="font-mono text-sm text-gray-600 p-4 whitespace-pre-wrap overflow-y-auto">
                            {JSON.stringify(character, null, 2)}
                          </pre>
                        </div>
                      )}
                      {activeTab === "edit" && (
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Coming soon
                          </h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Spinner />
                    </div>
                  )}
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

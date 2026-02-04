"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/elevenlabs/conversation";
import { ConversationBar } from "@/components/elevenlabs/conversation-bar";
import { Message, MessageContent } from "@/components/elevenlabs/message";
import { Response } from "@/components/elevenlabs/response";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCharacter } from "@/lib/context/character-context";
import { useUser } from "@/lib/context/user-context";
import RoleplayHint from "@/components/practice/roleplay-hint";
import { ActivityCompletion } from "@/components/activities/activity-completion";
import { DEFAULT_AGENT_ID } from "@/lib/constants";
import type { Tables } from "@/lib/supabase/types";

type Character = Tables<"characters">;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Helper function to build dynamic variables from character data
function buildDynamicVariables(
  character: Character | null,
  userName: string,
  userId: string,
  activityId?: string | null
): Record<string, string | number | boolean> {
  const baseVars: Record<string, string | number | boolean> = {
    user_name: userName,
  };

  // Only include user_id if it's not empty
  if (userId) {
    baseVars.user_id = userId;
  }

  // Include activity_id if provided
  if (activityId) {
    baseVars.activity_id = activityId;
  }

  if (!character) {
    return baseVars;
  }

  return {
    ...baseVars,
    character_name: character.character_name || "Unknown",
    character_age: character.age?.toString() || "Unknown",
    character_occupation: character.occupation || "Unknown",
    character_pronouns: character.pronouns || "they/them",
    scenario: character.recent_trigger_event || "No scenario provided",
    emotional_state: character.current_emotional_state || "neutral",
    communication_style:
      typeof character.communication_style === "object"
        ? JSON.stringify(character.communication_style)
        : String(character.communication_style || "casual"),
    sample_phrases:
      typeof character.characteristic_phrases === "object"
        ? JSON.stringify(character.characteristic_phrases)
        : String(character.characteristic_phrases || "[]"),
  };
}

interface ActivityPageProps {
  params: { id: string };
}

export default function RoleplayActivityPage({ params }: ActivityPageProps) {
  const router = useRouter();
  const [activityId, setActivityId] = useState<string | null>(null);

  const [activity, setActivity] = useState<any>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [agentId, setAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Get user from provider (no more client-side fetch!)
  const { userId, userName } = useUser();

  // Get character context
  const { selectCharacter } = useCharacter();

  // Fetch activity data on mount (still needed - activity-specific data)
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Get params
      const { id } = await params;
      setActivityId(id);

      // Check if user is available from provider
      if (!userId) {
        // User provider is still loading or user is not authenticated
        return;
      }

      // Fetch activity with character join
      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select(
          `
          *,
          modules!activities_module_id_fkey (
            id,
            title,
            course_id,
            courses (
              id,
              title
            )
          ),
          topics!activities_topic_id_fkey (
            id,
            title
          ),
          characters (
            *
          )
        `
        )
        .eq("id", id)
        .single();

      if (activityError || !activityData) {
        console.error("Error fetching activity:", activityError);
        router.push("/learn");
        return;
      }

      setActivity(activityData);

      // Validate this is a roleplay activity
      if (activityData.activity_type !== "roleplay") {
        router.push(`/activity/typeform/${id}`);
        return;
      }

      // Get character from join
      let fetchedCharacter = activityData.characters as Character | null;

      // If character_id is null, this roleplay activity doesn't have a character configured
      if (!activityData.character_id) {
        console.error("Roleplay activity missing character_id:", id);
        router.push("/learn");
        return;
      }

      // If join failed, try fetching character directly
      if (!fetchedCharacter && activityData.character_id) {
        const { data: fetchedChar, error: charError } = await supabase
          .from("characters")
          .select("*")
          .eq("id", activityData.character_id)
          .single();

        if (charError || !fetchedChar) {
          console.error(
            "Error fetching character:",
            charError,
            "character_id:",
            activityData.character_id
          );
          router.push("/learn");
          return;
        }

        fetchedCharacter = fetchedChar;
      }

      if (!fetchedCharacter) {
        router.push("/learn");
        return;
      }

      setCharacter(fetchedCharacter);

      // Get agent_id from activity or use default
      const currentAgentId = activityData.agent_id || DEFAULT_AGENT_ID;
      setAgentId(currentAgentId);

      setLoading(false);
    }

    fetchData();
  }, [params, router, userId]);

  // Set character in context when character changes
  useEffect(() => {
    if (character) {
      selectCharacter(character);
      // Clear messages when character changes
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id, selectCharacter]);

  if (loading || !activity || !character || !activityId || !userId) {
    return (
      <div className="relative flex flex-col w-full h-full mx-auto 2xl:mx-0 max-w-[1560px]">
        <div className="w-full h-12 flex items-start justify-start flex-shrink-0">
          <Breadcrumb className="">
            <BreadcrumbList>
              <BreadcrumbItem className="text-base font-medium text-muted-foreground">
                <BreadcrumbLink href="/learn">Courses</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-base font-medium text-muted-foreground">
                <BreadcrumbLink className="pointer-events-none">
                  <Skeleton className="h-5 w-24" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-base font-bold">
                <BreadcrumbLink className="pointer-events-none">
                  <Skeleton className="h-5 w-32" />
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full mx-auto 2xl:mx-0 max-w-[1560px]">
      <OnboardingStepDialog step="activity_roleplay_intro" />
      <div className="w-full h-12 flex items-start justify-start flex-shrink-0">
        <Breadcrumb className="">
          <BreadcrumbList>
            <BreadcrumbItem className="text-base font-medium text-muted-foreground">
              <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-base font-medium text-muted-foreground">
              {activity.modules?.course_id && activity.modules?.title ? (
                <BreadcrumbLink asChild className="pointer-events-none">
                  <Link href={`/learn/${activity.modules.course_id}`}>
                    {activity.modules.title}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink className="pointer-events-none">
                  <Skeleton className="h-5 w-24" />
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-base font-bold">
              <BreadcrumbLink asChild>
                <Link href={`/activity/roleplay/${activity.id}`}>
                  {activity.display_name || "Activity"}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 min-h-0">
        <div className="flex flex-row min-h-0 h-full w-full gap-4">
          <div className=" max-w-1/2 mx-auto divide-y divide-gray-200 overflow-hidden rounded-3xl border bg-card shadow-sm flex flex-col w-full">
            <div className="relative h-full overflow-hidden">
              <Conversation className="absolute inset-0 pb-[200px]">
                <ConversationContent className="flex min-w-0 flex-col gap-2 p-6 pb-48">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      image={character.profile_image_url || "/waves-01"}
                      title={`Roleplay with ${character.character_name}`}
                      description="Tap the play button to begin"
                      className="mx-auto max-w-3xs"
                    />
                  ) : (
                    messages.map((message, index) => {
                      return (
                        <div key={index} className="flex w-full flex-col gap-1">
                          <Message from={message.role}>
                            <MessageContent className="max-w-full min-w-0">
                              <Response className="w-auto [overflow-wrap:anywhere] whitespace-pre-wrap">
                                {message.content}
                              </Response>
                            </MessageContent>
                            {message.role === "assistant" && (
                              <div className="size-6 flex-shrink-0 self-end overflow-hidden rounded-full">
                                <img
                                  className="h-full w-full"
                                  src="/rhThumb.png"
                                  alt=""
                                />
                              </div>
                            )}
                          </Message>
                          {message.role === "assistant" && (
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      className={cn(
                                        "text-muted-foreground hover:text-foreground relative size-9 p-1.5"
                                      )}
                                      size="sm"
                                      type="button"
                                      variant="ghost"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          message.content
                                        );
                                        setCopiedIndex(index);
                                        setTimeout(
                                          () => setCopiedIndex(null),
                                          2000
                                        );
                                      }}
                                    >
                                      {copiedIndex === index ? (
                                        <CheckIcon className="size-4" />
                                      ) : (
                                        <CopyIcon className="size-4" />
                                      )}
                                      <span className="sr-only">
                                        {copiedIndex === index
                                          ? "Copied!"
                                          : "Copy"}
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {copiedIndex === index
                                        ? "Copied!"
                                        : "Copy"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </ConversationContent>
                <ConversationScrollButton className="bottom-[100px]" />
              </Conversation>
              <div className="absolute right-0 bottom-0 left-0 flex justify-center">
                <ConversationBar
                  className="w-full max-w-2xl"
                  agentId={agentId}
                  onConnect={() => setMessages([])}
                  onDisconnect={() => setMessages([])}
                  onSendMessage={(message) => {
                    const userMessage: ChatMessage = {
                      role: "user",
                      content: message,
                    };
                    setMessages((prev) => [...prev, userMessage]);
                  }}
                  onMessage={(message) => {
                    const newMessage: ChatMessage = {
                      role: message.source === "user" ? "user" : "assistant",
                      content: message.message,
                    };
                    setMessages((prev) => [...prev, newMessage]);
                  }}
                  onError={(error) =>
                    console.error("Conversation error:", error)
                  }
                  dynamicVariables={buildDynamicVariables(
                    character,
                    userName,
                    userId,
                    activityId
                  )}
                  hasSelectedCharacter={!!character}
                />
              </div>
            </div>
          </div>
          {activity.hint && <RoleplayHint />}
        </div>
      </div>

      {/* Activity Completion Dialog */}
      <ActivityCompletion
        typeformId={activityId}
        subjectId={activity.module_id || undefined}
        courseId={activity.modules?.course_id || undefined}
        testMode={true}
      />
    </div>
  );
}

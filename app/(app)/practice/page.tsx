"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import { PageContainer } from "@/components/layout/page-container";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCharacter } from "@/lib/context/character-context";
import { useUser } from "@/lib/context/user-context";
import type { Tables } from "@/lib/supabase/types";

import RoleplayHint from "@/components/practice/roleplay-hint";
import { PageHeaderWithActions } from "@/components/layout/text-headers";
import { PostConversationDialog } from "@/components/practice/post-conversation-dialog";

const DEFAULT_AGENT_ID = "agent_9901kayh483yfr4tqh89vn357es8";

type Character = Tables<"characters">;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Helper function to build dynamic variables from character data
function buildDynamicVariables(
  character: Character | null,
  userName: string,
  userId: string
): Record<string, string | number | boolean> {
  const baseVars: Record<string, string | number | boolean> = {
    user_name: userName,
  };

  // Only include user_id if it's not empty
  if (userId) {
    baseVars.user_id = userId;
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

export default function Page() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showPostConversationDialog, setShowPostConversationDialog] =
    useState(false);

  // Get user from provider (no more client-side fetch!)
  const { userId, userName } = useUser();

  // Get characters and selection from provider (no more client-side fetch!)
  const {
    characters,
    selectedCharacter,
    selectCharacter,
    loading: isLoadingCharacters,
  } = useCharacter();

  const handleConversationEnd = (sessionId: string | null) => {
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setShowPostConversationDialog(true);
    }
  };

  return (
    <PageContainer className="h-full pb-16">
      <OnboardingStepDialog step="practice_first_visit" />
      <PageHeaderWithActions
        title="Practice"
        actions={
          <Link href="/practice/history">
            <Button variant="secondary">View History</Button>
          </Link>
        }
        centerAction={
          <Select
            value={selectedCharacter?.id || ""}
            onValueChange={(value) => {
              const character = characters.find((c) => c.id === value);
              if (character) {
                selectCharacter(character);
              }
            }}
            disabled={isLoadingCharacters || characters.length === 0}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a character..." />
            </SelectTrigger>
            <SelectContent>
              {characters.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  {character.character_name}
                  {/* {character.difficulty_label && (
                    <span className="text-muted-foreground ml-2">
                      ({character.difficulty_label})
                    </span>
                  )} */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <main className="flex flex-row min-h-0 h-full w-full gap-4">
        <div className="divide-y divide-border overflow-hidden rounded-3xl bg-background-2 flex flex-col w-full">
          <div className="relative h-full overflow-hidden">
            <Conversation className="absolute inset-0 pb-[200px]">
              <ConversationContent className="flex min-w-0 flex-col gap-2 p-6 pb-6">
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    image={
                      selectedCharacter
                        ? selectedCharacter.profile_image_url || "/waves-01.png"
                        : "/waves-02.png"
                    }
                    title={
                      selectedCharacter
                        ? `Roleplay with ${selectedCharacter.character_name}`
                        : "Select a character to start"
                    }
                    description={
                      selectedCharacter ? "Tap the play button to begin" : ""
                    }
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
                            <div className="size-10 flex-shrink-0 self-end overflow-hidden rounded-full p-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                    {copiedIndex === index ? "Copied!" : "Copy"}
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
              {selectedCharacter && (
                <ConversationBar
                  className="w-full max-w-2xl"
                  agentId={DEFAULT_AGENT_ID}
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
                    selectedCharacter,
                    userName,
                    userId || ""
                  )}
                  hasSelectedCharacter={!!selectedCharacter}
                  userId={userId || undefined}
                  characterId={selectedCharacter.id}
                  characterName={selectedCharacter.character_name || undefined}
                  onConversationEnd={handleConversationEnd}
                />
              )}
            </div>
          </div>
        </div>
        <RoleplayHint />
      </main>

      <PostConversationDialog
        open={showPostConversationDialog}
        onOpenChange={setShowPostConversationDialog}
        sessionId={currentSessionId}
      />
    </PageContainer>
  );
}

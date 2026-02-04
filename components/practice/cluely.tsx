"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { ConversationEmptyState } from "@/components/elevenlabs/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useCharacter } from "@/lib/context/character-context";
import { Card } from "@/components/ui/card";

type Prompt = Tables<"prompts">;
type Character = Tables<"characters">;

// Format the detailed scenario text for the character context
const formatScenarioText = (character: Character): string => {
  const sections = [
    "IDENTITY & BACKGROUND:",
    `- Name: ${character.character_name}`,
    `- Age: ${character.age || "N/A"}`,
    `- Occupation: ${character.occupation || "N/A"}`,
    `- Relationship Status: ${character.relationship_status || "N/A"}`,
    "",
    "CURRENT SITUATION:",
    `- Recent Trigger Event: ${character.recent_trigger_event}`,
    `- Emotional State: ${
      character.current_emotional_state || "Mixed emotions"
    }`,
    `- Primary Issues: ${
      character.primary_issues?.join(", ") || "General challenges"
    }`,
    "",
  ];

  if (
    character.key_coaching_challenges &&
    character.key_coaching_challenges.length > 0
  ) {
    sections.push("KEY CHALLENGES:");
    character.key_coaching_challenges.forEach((challenge) => {
      sections.push(`- ${challenge}`);
    });
    sections.push("");
  }

  if (
    character.changes_already_made &&
    character.changes_already_made.length > 0
  ) {
    sections.push("CHANGES ALREADY MADE:");
    character.changes_already_made.forEach((change) => {
      sections.push(`- ${change}`);
    });
    sections.push("");
  } else {
    sections.push("CHANGES ALREADY MADE:");
    sections.push("- None yet");
    sections.push("");
  }

  if (character.what_character_wants) {
    sections.push("WHAT THIS PERSON WANTS:");
    sections.push(JSON.stringify(character.what_character_wants, null, 2));
    sections.push("");
  }

  if (character.what_character_knows) {
    sections.push("WHAT THIS PERSON KNOWS:");
    sections.push(JSON.stringify(character.what_character_knows, null, 2));
    sections.push("");
  }

  if (character.client_presentation_style) {
    sections.push("PRESENTATION STYLE:");
    sections.push(character.client_presentation_style);
    sections.push("");
  }

  sections.push("COACH-FACING CONTEXT:");
  sections.push(character.coach_facing_blurb);

  return sections.join("\n").trim();
};

const Cluely = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const { messages, sendMessage, status, regenerate } = useChat();

  // Use shared character context
  const { selectedCharacter } = useCharacter();

  // Fetch prompts from database
  useEffect(() => {
    const fetchPrompts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("order", { ascending: true });

      if (error) {
        console.error("Error fetching prompts:", error);
        setIsLoadingPrompts(false);
        return;
      }

      if (data) {
        setPrompts(data);
      }
      setIsLoadingPrompts(false);
    };

    fetchPrompts();
  }, []);

  const handleSuggestionClick = (label: string) => {
    const selectedPrompt = prompts.find((p) => p.label === label);
    if (!selectedPrompt || !selectedCharacter) {
      console.error("Missing prompt or character:", {
        label,
        selectedPrompt,
        selectedCharacter,
      });
      return;
    }

    console.log("Selected character:", selectedCharacter.character_name);
    console.log("Character ID:", selectedCharacter.id);

    // Format character details
    const characterContext = formatScenarioText(selectedCharacter);
    console.log(
      "Character context (first 200 chars):",
      characterContext.substring(0, 200)
    );

    // Replace {character_context} placeholder in template
    const populatedPrompt = selectedPrompt.template.replace(
      "{character_context}",
      characterContext
    );

    console.log(
      "Populated prompt (first 300 chars):",
      populatedPrompt.substring(0, 300)
    );

    // Send the full populated prompt with character context to the API
    // (User messages are filtered out of UI, so this won't be displayed)
    sendMessage(
      { text: populatedPrompt }, // Full prompt with character details
      {
        body: {
          messages: messages,
        },
      }
    );
  };

  return (
    <div className="mx-auto relative h-full min-h-0">
      <div className="flex flex-col h-full min-h-0">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.filter((message) => message.role === "assistant")
              .length === 0 ? (
              <ConversationEmptyState
              // title="NBG Assistant"
              // description="Tap buttons below to generate client-specific NBG"
              />
            ) : (
              messages
                .filter((message) => message.role === "assistant") // Only show assistant messages
                .map((message) => (
                  <div key={message.id}>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Message
                              className="last:pb-[88px]"
                              key={`${message.id}-${i}`}
                              from="assistant"
                            >
                              <MessageContent>
                                <MessageResponse>{part.text}</MessageResponse>
                              </MessageContent>
                              <MessageActions>
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            </Message>
                          );
                        case "reasoning":
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={
                                status === "streaming" &&
                                i === message.parts.length - 1 &&
                                message.id === messages.at(-1)?.id
                              }
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                ))
            )}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Show suggestions when character is selected and prompts are loaded */}
        {!isLoadingPrompts && prompts.length > 0 && selectedCharacter && (
          <div className="absolute right-0 bottom-0 left-0 flex justify-center p-4 bg-gradient-to-t from-background-2 to-transparent">
            <Card className="border-none p-2 w-full max-w-2xl shadow-lg bg-card-default rounded-xl">
              <Suggestions>
                {prompts.map((prompt, index) => {
                  const hasNoMessages =
                    messages.filter((message) => message.role === "assistant")
                      .length === 0;
                  const isFirstSuggestion = index === 0;
                  const isGenerating =
                    status === "submitted" || status === "streaming";

                  return (
                    <Suggestion
                      key={prompt.id}
                      onClick={handleSuggestionClick}
                      suggestion={prompt.label}
                      disabled={isGenerating}
                      className={
                        hasNoMessages && isFirstSuggestion
                          ? "animate-pulse text-white bg-brand hover:animate-none hover:bg-brand/90"
                          : "bg-card-active hover:bg-border-default"
                      }
                    />
                  );
                })}
              </Suggestions>
            </Card>
          </div>
        )}

        {/* Show message if no character is selected */}
        {!selectedCharacter && !isLoadingPrompts && (
          <div className="p-4 text-text-secondary text-sm">
            
          </div>
        )}
      </div>
    </div>
  );
};
export default Cluely;

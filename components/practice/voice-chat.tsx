"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useConversation } from "@elevenlabs/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/elevenlabs/conversation";
import { Message, MessageContent } from "@/components/elevenlabs/message";
import { Response } from "@/components/elevenlabs/response";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LiveWaveform } from "@/components/elevenlabs/live-waveform";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpIcon,
  ChevronDown,
  Keyboard,
  Mic,
  MicOff,
  PhoneIcon,
  XIcon,
} from "lucide-react";
import { useCharacter } from "@/lib/context/character-context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VoiceChatProps {
  agentId: string;
  dynamicVariables?: Record<string, string | number | boolean>;
  className?: string;
}

export function VoiceChat({
  agentId,
  dynamicVariables,
  className,
}: VoiceChatProps) {
  // Internal state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [agentState, setAgentState] = useState<
    "disconnected" | "connecting" | "connected" | "disconnecting" | null
  >("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Access shared character via context
  const { selectedCharacter } = useCharacter();

  // Conversation hook - manages connection directly in this component
  const conversation = useConversation({
    onConnect: () => {
      console.log("[VoiceChat] onConnect fired");
      setMessages([]);
    },
    onDisconnect: () => {
      console.log("[VoiceChat] onDisconnect fired");
      setAgentState("disconnected");
      setMessages([]);
      setKeyboardOpen(false);
    },
    onMessage: (message) => {
      console.log("[VoiceChat] onMessage fired:", message);
      if (message.message) {
        const newMessage: ChatMessage = {
          role: message.source === "user" ? "user" : "assistant",
          content: message.message,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    },
    micMuted: isMuted,
    onError: (error) => {
      console.error("[VoiceChat] Error:", error);
      setAgentState("disconnected");
    },
  });

  // Mic stream handler
  const getMicStream = useCallback(async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    return stream;
  }, []);

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      console.log("[VoiceChat] Setting state to connecting");
      setAgentState("connecting");
      console.log("[VoiceChat] Getting mic stream...");
      await getMicStream();
      console.log("[VoiceChat] Starting session with agentId:", agentId);
      console.log("[VoiceChat] Dynamic variables:", dynamicVariables);
      await conversation.startSession({
        agentId,
        dynamicVariables,
        connectionType: "webrtc",
        onStatusChange: (status) => {
          console.log("[VoiceChat] Status changed to:", status.status);
          setAgentState(status.status);
        },
      });
      console.log("[VoiceChat] Session started successfully");
    } catch (error) {
      console.error("[VoiceChat] Error starting conversation:", error);
      setAgentState("disconnected");
    }
  }, [conversation, getMicStream, agentId, dynamicVariables]);

  // End conversation
  const endConversation = useCallback(() => {
    console.log("[VoiceChat] Ending session");
    conversation.endSession();
    setAgentState("disconnected");
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, [conversation]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Send text message
  const sendTextMessage = useCallback(() => {
    if (!textInput.trim()) return;
    const messageToSend = textInput;
    conversation.sendUserMessage(messageToSend);
    setTextInput("");
    const newMessage: ChatMessage = {
      role: "user",
      content: messageToSend,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [conversation, textInput]);

  // Clear messages when character changes
  useEffect(() => {
    console.log("[VoiceChat] Character changed, clearing messages");
    setMessages([]);
  }, [selectedCharacter?.id]);

  // Log when messages change
  useEffect(() => {
    console.log("[VoiceChat] Messages updated, count:", messages.length);
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Card
      className={cn(
        "flex-1 w-full flex-col gap-0 overflow-hidden rounded-4xl shadow-none bg-gray-50 py-0",
        className
      )}
    >
      <CardContent className="relative flex-1 overflow-hidden p-0 ">
        <Conversation className="absolute inset-0 pb-[88px]">
          <ConversationContent className="flex min-w-0 flex-col gap-2 p-6 pb-6">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title={`NBG Roleplay - ${selectedCharacter?.character_name}`}
                description="Tap the play button to start"
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
                        <div className="size-6 flex-shrink-0">
                          <img
                            className="h-full w-full"
                            src="/rhThumb.png"
                            alt="Assistant avatar"
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
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                              >
                                {copiedIndex === index ? (
                                  <CheckIcon className="size-4" />
                                ) : (
                                  <CopyIcon className="size-4" />
                                )}
                                <span className="sr-only">
                                  {copiedIndex === index ? "Copied!" : "Copy"}
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
        <div className="absolute right-0 bottom-0 left-0 flex justify-center py-4">
          <Card className="m-0 w-full max-w-2xl gap-0 border p-0 shadow-lg">
            <div className="flex flex-col-reverse">
              <div>
                {keyboardOpen && <Separator />}
                <div className="flex items-center justify-between gap-2 p-2">
                  <div className="h-8 w-[120px] md:h-10">
                    <div
                      className={cn(
                        "flex h-full items-center gap-2 rounded-md py-1",
                        "bg-foreground/5 text-foreground/70"
                      )}
                    >
                      <div className="h-full flex-1">
                        <div
                          className={cn(
                            "relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-sm"
                          )}
                        >
                          <LiveWaveform
                            key={
                              agentState === "disconnected" ? "idle" : "active"
                            }
                            active={agentState === "connected" && !isMuted}
                            processing={agentState === "connecting"}
                            barWidth={3}
                            barGap={1}
                            barRadius={4}
                            fadeEdges={true}
                            fadeWidth={24}
                            sensitivity={1.8}
                            smoothingTimeConstant={0.85}
                            height={20}
                            mode="static"
                            className={cn(
                              "h-full w-full transition-opacity duration-300",
                              agentState === "disconnected" && "opacity-0"
                            )}
                          />
                          {agentState === "disconnected" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-foreground/50 text-[10px] font-medium">
                                Customer Support
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      aria-pressed={isMuted}
                      className={cn(isMuted ? "bg-foreground/5" : "")}
                      disabled={agentState !== "connected"}
                    >
                      {isMuted ? <MicOff /> : <Mic />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setKeyboardOpen((v) => !v)}
                      aria-pressed={keyboardOpen}
                      className="relative"
                      disabled={agentState !== "connected"}
                    >
                      <Keyboard
                        className={
                          "h-5 w-5 transform-gpu transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                          (keyboardOpen
                            ? "scale-75 opacity-0"
                            : "scale-100 opacity-100")
                        }
                      />
                      <ChevronDown
                        className={
                          "absolute inset-0 m-auto h-5 w-5 transform-gpu transition-all delay-50 duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
                          (keyboardOpen
                            ? "scale-100 opacity-100"
                            : "scale-75 opacity-0")
                        }
                      />
                    </Button>
                    <Separator
                      orientation="vertical"
                      className="mx-1 -my-2.5"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={
                        agentState === "connected" ||
                        agentState === "connecting"
                          ? endConversation
                          : startConversation
                      }
                      disabled={agentState === "disconnecting"}
                    >
                      {agentState === "connected" ||
                      agentState === "connecting" ? (
                        <XIcon className="h-5 w-5" />
                      ) : (
                        <PhoneIcon className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  keyboardOpen ? "max-h-[120px]" : "max-h-0"
                )}
              >
                <div className="relative px-2 pt-2 pb-2">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendTextMessage();
                      }
                    }}
                    placeholder="Enter your message..."
                    className="min-h-[100px] resize-none border-0 pr-12 shadow-none focus-visible:ring-0"
                    disabled={agentState !== "connected"}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={sendTextMessage}
                    disabled={!textInput.trim() || agentState !== "connected"}
                    className="absolute right-3 bottom-3 h-8 w-8"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

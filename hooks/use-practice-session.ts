"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface CreateSessionParams {
  userId: string;
  characterId?: string;
  characterName?: string;
  activityId?: string;
  agentId?: string;
}

interface UsePracticeSessionReturn {
  sessionId: string | null;
  createSession: (params: CreateSessionParams) => Promise<string | null>;
  clearSession: () => void;
  isCreating: boolean;
}

export function usePracticeSession(): UsePracticeSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const sessionCreatedRef = useRef(false);

  const createSession = useCallback(
    async (params: CreateSessionParams): Promise<string | null> => {
      // Prevent duplicate session creation
      if (sessionCreatedRef.current || isCreating) {
        console.log("[usePracticeSession] Session already created or creating");
        return sessionId;
      }

      setIsCreating(true);
      sessionCreatedRef.current = true;

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("practice_sessions")
          .insert({
            user_id: params.userId,
            character_id: params.characterId || null,
            character_name: params.characterName || null,
            activity_id: params.activityId || null,
            agent_id: params.agentId || null,
            // Minimal data on creation - webhook will enrich later
          })
          .select("id")
          .single();

        if (error) {
          console.error("[usePracticeSession] Error creating session:", error);
          sessionCreatedRef.current = false;
          return null;
        }

        console.log("[usePracticeSession] Session created:", data.id);
        setSessionId(data.id);
        return data.id;
      } catch (error) {
        console.error("[usePracticeSession] Exception creating session:", error);
        sessionCreatedRef.current = false;
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, sessionId]
  );

  const clearSession = useCallback(() => {
    setSessionId(null);
    sessionCreatedRef.current = false;
  }, []);

  return {
    sessionId,
    createSession,
    clearSession,
    isCreating,
  };
}



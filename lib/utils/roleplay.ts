import type { Tables } from "@/lib/supabase/types";

type Character = Tables<"characters">;

/**
 * Builds dynamic variables for ElevenLabs roleplay conversations
 * from character data and user information.
 */
export function buildDynamicVariables(
  character: Character | null,
  userName: string,
  userId: string,
  activityId?: string
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


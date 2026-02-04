"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Character = Tables<"characters">;

interface CharacterContextValue {
  characters: Character[];
  selectedCharacter: Character | null;
  selectCharacter: (character: Character | null) => void;
  loading: boolean;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("characters")
      .select("*")
      .eq("is_published", true)
      .eq("is_active", true)
      .order("difficulty_rating", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching characters:", error);
        } else {
          setCharacters(data || []);
        }
        setLoading(false);
      });
  }, []);

  return (
    <CharacterContext.Provider
      value={{
        characters,
        selectedCharacter,
        selectCharacter: setSelectedCharacter,
        loading,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacter must be used within CharacterProvider");
  }
  return context;
}

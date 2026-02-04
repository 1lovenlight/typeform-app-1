"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { Spinner } from "@/components/ui/spinner";
import CharacterDrawer from "@/components/characters/character-drawer";
import { Button } from "@/components/ui/button";
import { CharacterAvatar } from "./character-avatar";

type Character = Tables<"characters">;

export default function CharacterListSimple() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<
    Character | undefined
  >(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .order("character_name");

        if (error) {
          setError(error.message);
        } else {
          setCharacters(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No characters found.</div>
      </div>
    );
  }

  const handleViewCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setDrawerOpen(true);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {characters.map((character) => (
        <div
          key={character.id}
          className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm flex flex-col"
        >
          <div className="px-4 py-5 sm:px-6">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-4">
                <CharacterAvatar
                  characterId={character.id}
                  className="h-24 w-24"
                />
                <span className="text-base/7 font-semibold text-gray-900">
                  {character.character_name}
                </span>
              </div>
              <Button
                onClick={() => handleViewCharacter(character)}
                variant="ghost"
                className="border"
              >
                View
              </Button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6 flex-1">
            <div className="space-y-2">
              {Array.isArray(character.key_topics) &&
                (character.key_topics as { topic?: string }[])
                  .slice(0, 10)
                  .map((topic, index) => (
                    <p
                      key={index}
                      className="text-sm font-medium text-gray-900 line-clamp-1"
                    >
                      {topic?.topic || "Unknown topic"}
                    </p>
                  ))}
            </div>
          </div>
        </div>
      ))}

      <CharacterDrawer
        character={selectedCharacter}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          // setSelectedCharacter(undefined);
        }}
      />
    </div>
  );
}

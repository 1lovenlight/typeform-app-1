"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useCharacter } from "@/lib/context/character-context";

interface CharacterAvatarProps {
  characterId?: string;
  className?: string;
}

export const CharacterAvatar = ({
  characterId,
  className,
}: CharacterAvatarProps) => {
  const { characters, loading } = useCharacter();

  // Find the character by ID from the cached list
  const character = characterId
    ? characters.find((c) => c.id === characterId)
    : null;

  const name = character?.character_name || "";
  const profileImage = character?.profile_image_url || null;

  const initials =
    name
      ?.split(" ")
      ?.map((word) => word[0])
      ?.join("")
      ?.toUpperCase() || "?";

  return (
    <Avatar className={className}>
      {profileImage && !loading && (
        <AvatarImage src={profileImage} alt={initials} />
      )}
      <AvatarFallback className="bg-gray-200">
        {loading ? <Spinner /> : initials}
      </AvatarFallback>
    </Avatar>
  );
};

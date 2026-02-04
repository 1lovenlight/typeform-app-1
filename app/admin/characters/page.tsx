import CharacterListSimple from "@/components/characters/character-list-simple";

export default function Page() {
  return (
    <div className="flex flex-col w-full mx-auto gap-6">
      <h2 className="text-4xl font-semibold tracking-tight">Characters</h2>
      <CharacterListSimple />
    </div>
  );
}

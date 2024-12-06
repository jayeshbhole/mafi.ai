import GameChatRoom from "@/components/GameChatRoom";

export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <GameChatRoom gameId={params.id} />
    </main>
  );
}

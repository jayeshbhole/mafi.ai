import VotingScreen from "@/components/VotingScreen";

export default function VotePage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <VotingScreen gameId={params.id} />
    </main>
  );
}

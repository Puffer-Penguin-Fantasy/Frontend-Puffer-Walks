import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useFitbit } from "@/integrations/fitbit/hooks/useFitbit";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { Header } from "@/components/Header";
import { WalletPanel } from "@/components/WalletPanel";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function LeaderboardPage() {
  const { gameId: gameSlug } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { games, isLoading: gamesLoading } = useGame();
  const { account } = useWallet();
  const { steps, isConnected } = useFitbit();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const game = games.find((g) => g.slug === gameSlug || g.id === gameSlug);
  const myAddress = account?.address?.toString()?.toLowerCase();

  // Sync identities and metadata
  useEffect(() => {
    const syncData = async () => {
      if (!game || isSyncing) return;
      setIsSyncing(true);
      try {
        const gameRef = doc(db, "games", game.id);
        await setDoc(gameRef, {
          name: game.name,
          startTime: parseInt(game.start_time),
          endTime: parseInt(game.end_time),
          numDays: parseInt(game.no_of_days),
          minSteps: parseInt(game.min_daily_steps),
          deposit: parseFloat(game.deposit_amount) / 100_000_000
        }, { merge: true });

        for (const pAddr of (game.participants || [])) {
          const standardizedPAddr = pAddr.toLowerCase();
          const pRef = doc(db, "games", game.id, "participants", standardizedPAddr);
          const pSnap = await getDoc(pRef);
          if (!pSnap.exists() || !pSnap.data()?.username) {
            const userSnap = await getDoc(doc(db, "users", standardizedPAddr));
            const profile = userSnap.exists() ? userSnap.data() : null;
            await setDoc(pRef, {
              walletAddress: standardizedPAddr,
              username: profile?.username || null,
              profileImage: profile?.profileImage || null,
              joinedAt: Date.now(),
              isEliminated: pSnap.exists() ? pSnap.data()?.isEliminated : false
            }, { merge: true });
          }
        }
      } catch (err) {
        console.error("Leaderboard Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    };
    if (game && game.participants?.length > 0) syncData();
  }, [game]);

  // Live Step Sync (No history, current day only)
  useEffect(() => {
    const syncTodaySteps = async () => {
      if (!game || !myAddress || !isConnected || steps === null) return;
      try {
        const gameStart = new Date(parseInt(game.start_time) * 1000);
        gameStart.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(now.getTime() - gameStart.getTime());
        const currentDayIdx = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dayKey = `day${currentDayIdx + 1}`;
        const pRef = doc(db, "games", game.id, "participants", myAddress);
        await updateDoc(pRef, { [`days.${dayKey}`]: steps, lastUpdated: new Date().toISOString() });
      } catch (err) {
        console.error("Live sync failed:", err);
      }
    };
    const interval = setTimeout(syncTodaySteps, 2000);
    return () => clearTimeout(interval);
  }, [steps, isConnected, game, myAddress]);


  if (gamesLoading) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6">
        <div className="text-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm max-w-sm w-full">
          <Trophy size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold mb-2">Game Not Found</h1>
          <button onClick={() => navigate("/")} className="w-full py-4 mt-4 bg-gray-900 text-white rounded-2xl">back home</button>
        </div>
      </div>
    );
  }

  const startTime = new Date(parseInt(game.start_time) * 1000);
  const endTime = new Date(parseInt(game.end_time) * 1000);
  const now = new Date();
  const isUpcoming = startTime > now;
  const isActive = startTime <= now && endTime > now;
  const isSummarising = endTime <= now && now.getTime() < endTime.getTime() + 48 * 60 * 60 * 1000;
  
  let status: 'upcoming' | 'live' | 'summarising' | 'ended' = 'ended';
  if (isUpcoming) status = 'upcoming';
  else if (isActive) status = 'live';
  else if (isSummarising) status = 'summarising';

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <Header onOpenWallet={() => setIsWalletOpen(true)} />

      <main className="container mx-auto px-4 pt-24 max-w-5xl">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center gap-1 text-gray-400 text-sm hover:text-gray-900 transition-colors lowercase mb-6"
        >
          <ArrowLeft size={16} /> back
        </button>

        <GameLeaderboard
          gameId={game.id}
          gameName={game.name}
          numDays={parseInt(game.no_of_days)}
          minDailySteps={parseInt(game.min_daily_steps)}
          status={status}
          startTime={startTime}
          imageUrl={game.image_url}
          entryDeposit={parseFloat(game.deposit_amount) / 100_000_000}
          sponsorName={game.sponsor_name}
          sponsorAmount={parseFloat(game.sponsor_amount)}
          sponsorImageUrl={game.sponsor_image_url}
        />
      </main>

      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
}

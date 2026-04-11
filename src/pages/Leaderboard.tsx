import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useFitbit } from "@/integrations/fitbit/hooks/useFitbit";
import { useAccount } from "@razorlabs/razorkit";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { Header } from "@/components/Header";
import { WalletPanel } from "@/components/WalletPanel";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function LeaderboardPage() {
  const { gameId: gameSlug } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { games, isLoading: gamesLoading } = useGame();
  const { address: rawAddress } = useAccount();
  const { steps, isConnected } = useFitbit();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const game = games.find((g) => g.slug === gameSlug || g.id === gameSlug);
  const myAddress = rawAddress?.toLowerCase();

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
              isEliminated: (pSnap.exists() && pSnap.data()?.isEliminated === true) ? true : false
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
        gameStart.setUTCHours(0, 0, 0, 0);
        
        const gameEnd = new Date(parseInt(game.end_time) * 1000);
        gameEnd.setUTCHours(0, 0, 0, 0);

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);

        // ONLY sync if the game is currently active
        if (now < gameStart || now >= gameEnd) return;

        const diffTime = now.getTime() - gameStart.getTime();
        const currentDayIdx = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
    return (
      <div className="min-h-screen bg-background">
        <Header onOpenWallet={() => setIsWalletOpen(true)} />
        <main className="container mx-auto px-4 pt-24 max-w-5xl">
          <div className="w-16 h-4 bg-muted rounded animate-pulse mb-6" />
          
          <div className="flex flex-col gap-4">
            {/* Sponsor Card Skeleton */}
            <div className="h-32 bg-muted rounded-2xl animate-pulse w-full" />
            
            {/* Main Content Skeleton */}
            <div className="bg-card rounded-2xl border-2 border-border p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="w-1/3 h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="w-1/4 h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 py-6 border-y border-border mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-2 bg-muted rounded animate-pulse" />
                    <div className="w-12 h-5 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse w-full" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center bg-card p-8 rounded-[32px] border border-border shadow-sm max-w-sm w-full">
          <Trophy size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-foreground">Game Not Found</h1>
          <button onClick={() => navigate("/")} className="w-full py-4 mt-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium">back home</button>
        </div>
      </div>
    );
  }

  const isJoined = game.participants?.some(p => p.toLowerCase() === myAddress);
  
  if (!game.is_public && !isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 px-4">
        <div className="text-center bg-card p-10 rounded-[40px] border border-border shadow-xl shadow-black/5 max-w-sm w-full">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-3 lowercase tracking-tight">Private Battle</h1>
          <p className="text-muted-foreground text-sm mb-10 lowercase leading-relaxed">This competition is invite-only. You must join through the main dashboard using a code to access the results.</p>
          <button onClick={() => navigate("/")} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-black/10">Back to Dashboard</button>
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
    <div className="min-h-screen bg-background pb-20">
      <Header onOpenWallet={() => setIsWalletOpen(true)} />

      <main className="container mx-auto px-4 pt-24 max-w-5xl">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors lowercase mb-6"
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
          sponsorImageUrl={game.sponsor_image_url}
        />
      </main>

      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
}

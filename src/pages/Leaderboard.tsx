import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { useAccount } from "@razorlabs/razorkit";
import { GameLeaderboard } from "../components/GameLeaderboard";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { WalletPanel } from "../components/WalletPanel";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { useSound } from "../hooks/useSound";

import blueBackground from "../assets/blue.jpg"

export default function LeaderboardPage() {
  const { gameId: gameSlug } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { games, isLoading: gamesLoading } = useGame();
  const { address: rawAddress } = useAccount();
  const { playClick } = useSound();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Use useMemo to avoid recalculating on every re-render
  const game = useMemo(() => {
    return games.find((g) => g.slug === gameSlug || g.id === gameSlug);
  }, [games, gameSlug]);

  const myAddress = rawAddress?.toLowerCase();

  // Sync identities and metadata
  useEffect(() => {
    const syncData = async () => {
      if (!game || isSyncing) return;
      setIsSyncing(true);
      try {
        const gameRef = doc(db, "games", game.id);
        await setDoc(gameRef, {
          name: game.name || "Unknown Game",
          startTime: parseInt(game.start_time || "0"),
          endTime: parseInt(game.end_time || "0"),
          numDays: parseInt(game.no_of_days || "0"),
          minSteps: parseInt(game.min_daily_steps || "0"),
          deposit: parseFloat(game.deposit_amount || "0") / 100_000_000
        }, { merge: true });

        const participants = game.participants || [];
        
        // 1. Fetch all existing Firestore participants at once to avoid loop getDocs
        const pCollRef = collection(db, "games", game.id, "participants");
        const existingPSnap = await getDocs(pCollRef);
        const existingPMap = new Map(existingPSnap.docs.map(d => [d.id, d.data()]));

        // 2. Filter for participants that need syncing
        const participantsToSync = participants.filter(p => {
          const pAddr = typeof p === 'string' ? p : ((p as any)?.value || String(p));
          if (!pAddr || pAddr === "[object Object]") return false;
          const standardizedPAddr = pAddr.toLowerCase();
          const existing = existingPMap.get(standardizedPAddr) as any;
          return !existing || !existing.username;
        });

        // 3. Sync them in parallel batches (or all at once if small enough)
        await Promise.all(participantsToSync.map(async (p) => {
          try {
            const pAddr = typeof p === 'string' ? p : ((p as any)?.value || String(p));
            const standardizedPAddr = pAddr.toLowerCase();
            const pRef = doc(db, "games", game.id, "participants", standardizedPAddr);
            
            const userSnap = await getDoc(doc(db, "users", standardizedPAddr));
            const profile = userSnap.exists() ? userSnap.data() : null;
            
            await setDoc(pRef, {
              walletAddress: standardizedPAddr,
              username: profile?.username || null,
              profileImage: profile?.profileImage || null,
              joinedAt: Date.now(),
              isEliminated: (existingPMap.get(standardizedPAddr) as any)?.isEliminated === true
            }, { merge: true });
          } catch (innerErr) {
            console.error("Participant Sync Error:", innerErr);
          }
        }));
      } catch (err) {
        console.error("Leaderboard Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    };
    if (game && Array.isArray(game.participants) && game.participants.length > 0) {
        syncData();
    }
  }, [game]);

  if (gamesLoading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${blueBackground})` }}
      >
        <Header onOpenWallet={() => setIsWalletOpen(true)} />
        <main className="container mx-auto px-4 pt-24 max-w-5xl">
          <div className="w-16 h-4 bg-white/20 rounded animate-pulse mb-6" />
          <div className="flex flex-col gap-4">
            <div className="h-32 bg-white/10 backdrop-blur-md rounded-2xl animate-pulse w-full" />
            <div className="bg-black/40 backdrop-blur-md rounded-2xl border-2 border-white/10 p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1">
                  <div className="w-1/3 h-6 bg-white/10 rounded animate-pulse mb-2" />
                  <div className="w-1/4 h-3 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!game) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed p-6"
        style={{ backgroundImage: `url(${blueBackground})` }}
      >
        <div className="text-center bg-black/40 backdrop-blur-md p-8 rounded-[32px] border border-white/10 shadow-sm max-w-sm w-full">
          <Trophy size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-bold mb-2 text-white">Game Not Found</h1>
          <button onClick={() => { playClick(); navigate("/"); }} className="w-full py-4 mt-4 bg-white text-black font-bold rounded-2xl text-sm transition-all active:scale-95">back home</button>
        </div>
      </div>
    );
  }

  const isJoined = game.participants?.some(p => {
    const pAddr = typeof p === 'string' ? p : ((p as any)?.value || String(p));
    return pAddr && typeof pAddr === 'string' && pAddr.toLowerCase() === myAddress;
  });
  
  if (!game.is_public && !isJoined) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed p-6 px-4"
        style={{ backgroundImage: `url(${blueBackground})` }}
      >
        <div className="text-center bg-black/40 backdrop-blur-md p-10 rounded-[40px] border border-white/10 shadow-xl max-w-sm w-full">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-white/40" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Private Battle</h1>
          <p className="text-white/60 text-sm mb-10 lowercase leading-relaxed">This competition is invite-only. You must join through the main dashboard using a code to access the results.</p>
          <button onClick={() => { playClick(); navigate("/"); }} className="w-full py-4 bg-white text-black font-bold rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-black/10">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const sSeconds = parseInt(game.start_time || "0");
  const eSeconds = parseInt(game.end_time || "0");
  const startTime = new Date(sSeconds * 1000);
  const endTime = new Date(eSeconds * 1000);
  const now = new Date();
  const isUpcoming = startTime > now;
  const isActive = startTime <= now && endTime > now;
  const isSummarising = endTime <= now && now.getTime() < endTime.getTime() + (48 * 60 * 60 * 1000);
  
  let status: 'upcoming' | 'live' | 'summarising' | 'ended' = 'ended';
  if (isUpcoming) status = 'upcoming';
  else if (isActive) status = 'live';
  else if (isSummarising) status = 'summarising';
  else status = 'ended';

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed pb-20"
      style={{ backgroundImage: `url(${blueBackground})` }}
    >
      <Header onOpenWallet={() => setIsWalletOpen(true)} />

      <main className="container mx-auto px-4 pt-24 max-w-5xl">
        <button 
          onClick={() => { playClick(); navigate("/"); }} 
          className="flex items-center gap-1 text-muted-foreground text-sm hover:text-white transition-colors lowercase mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> back
        </button>

        <GameLeaderboard
          gameId={game.id}
          gameName={game.name || ""}
          numDays={parseInt(game.no_of_days || "0")}
          minDailySteps={parseInt(game.min_daily_steps || "0")}
          status={status}
          startTime={startTime}
          imageUrl={game.image_url}
          entryDeposit={parseFloat(game.deposit_amount || "0") / 100_000_000}
          sponsorName={game.sponsor_name}
          sponsorImageUrl={game.sponsor_image_url}
        />
      </main>

      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      
      <Footer />
    </div>
  );
}

import React from "react";
import { useAccount } from "@razorlabs/razorkit";
import { useProfile } from "../hooks/useProfile";
import { useGame } from "../hooks/useGame";
import { useSound } from "../hooks/useSound";
import { 
  Trophy, 
  MapPin, 
  Copy, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { GameCard } from "../components/GameCard";
import pfpFrame from "../assets/gameframe/pfpframe.png";
import userAvatar from "../assets/user-avatar.png";
import { Header } from "../components/Header";
import { WalletPanel } from "../components/WalletPanel";
import { AdminPanel } from "../components/AdminPanel";

export default function Profile() {
  const { address, isConnected } = useAccount();
  const normalizedAddress = address?.toLowerCase();
  const { profileImage, username } = useProfile(normalizedAddress);
  const { games, joinGame, claimRewards } = useGame();
  const { playClick } = useSound();
  const [copied, setCopied] = React.useState(false);
  const [isWalletOpen, setIsWalletOpen] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  
  const userGames = games.filter(g => 
    g.participants?.some((p: any) => {
      const pAddr = typeof p === 'string' ? p : (p.value || "");
      return pAddr.toLowerCase() === normalizedAddress;
    })
  );

  const activeGames = userGames.filter(g => parseInt(g.end_time) >= Math.floor(Date.now() / 1000));
  const finishedGames = userGames.filter(g => parseInt(g.end_time) < Math.floor(Date.now() / 1000));

  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : "";

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playClick();
    }
  };

  const standardize = (addr: string | null | undefined) => {
    if (!addr) return "";
    let clean = addr.toLowerCase();
    if (!clean.startsWith("0x")) clean = "0x" + clean;
    return clean;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header 
        onOpenWallet={() => setIsWalletOpen(true)} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="container mx-auto px-4 pt-32 pb-32 max-w-6xl">
        {/* Profile Hero Section - Matches Settings UI Structure */}
        <div className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10 p-8 md:p-12 overflow-hidden relative">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 text-center md:text-left">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
              <img src={pfpFrame} alt="Frame" className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
              <div className="relative w-[75%] h-[75%] mx-auto mt-[12.5%] rounded-full overflow-hidden bg-black/40">
                <img 
                  src={profileImage || userAvatar} 
                  alt="Profile" 
                  className={`w-full h-full object-cover ${!profileImage ? 'opacity-40' : ''}`} 
                />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-xirod mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                {username}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                <div 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] md:text-xs font-mono text-white/50 cursor-pointer hover:bg-white/10 transition-all group"
                >
                  {shortAddress}
                  {copied ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} className="group-hover:text-white transition-colors" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-blue-400 tracking-tight">
                  <MapPin size={12} className="md:w-3.5 md:h-3.5" /> Joined {userGames.length} Games
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:gap-3 w-full md:w-auto relative z-10">
            <button 
              onClick={() => { playClick(); setIsWalletOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xs md:text-sm font-medium hover:bg-white/10 transition-all active:scale-95"
            >
              Edit Profile
            </button>
            <a 
              href={`https://explorer.movementnetwork.xyz/account/${address}?network=testnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-11 md:h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs md:text-sm font-medium hover:bg-blue-600/20 transition-all active:scale-95"
            >
              <ExternalLink size={14} /> View Explorer
            </a>
          </div>
        </div>

        <div className="space-y-20">
          {/* Active User Games */}
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl text-white mb-2 tracking-tight">Your Active Competitions</h2>
              <p className="text-white/40 text-sm tracking-tight font-light">Competitions you are currently participating in.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeGames.length > 0 ? (
                activeGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onJoin={(id) => joinGame(id)}
                    onClaim={() => claimRewards(game.id)}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10 text-center">
                  <Trophy className="w-10 h-10 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm font-light">No active competitions found.</p>
                </div>
              )}
            </div>
          </section>

          {/* Finished User Games */}
          {finishedGames.length > 0 && (
            <section className="space-y-8">
              <div className="border-t border-white/10 pt-12">
                <h2 className="text-2xl text-white mb-2 tracking-tight">Your Finished Competitions</h2>
                <p className="text-white/40 text-sm tracking-tight font-light">Review your performance in past battles.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {finishedGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onJoin={(id) => joinGame(id)}
                    onClaim={() => claimRewards(game.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

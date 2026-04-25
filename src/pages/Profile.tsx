import React from "react";
import { useAccount } from "@razorlabs/razorkit";
import { useProfile } from "../hooks/useProfile";
import { useGame } from "../hooks/useGame";
import { useSound } from "../hooks/useSound";
import { useArcticPenguin } from "../hooks/useArcticPenguin";
import { useFitbit } from "../integrations/fitbit/hooks/useFitbit";
import { Activity } from "lucide-react";
import {
  Trophy,
  MapPin,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GameCard } from "../components/GameCard";
import pfpFrame from "../assets/gameframe/pfpframe.png";
import userAvatar from "../assets/user-avatar.png";
import { Header } from "../components/Header";
import { WalletPanel } from "../components/WalletPanel";
import { AdminPanel } from "../components/AdminPanel";

export default function Profile() {
  const { address } = useAccount();
  const normalizedAddress = address?.toLowerCase();
  const { profileImage, username } = useProfile(normalizedAddress);
  const { games, joinGame, claimRewards } = useGame();
  const { data: arcticData, isLoading: arcticLoading } = useArcticPenguin(normalizedAddress);
  const { steps: fitbitSteps, isConnected: isFitbitConnected } = useFitbit();
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

  const [currentSlide, setCurrentSlide] = React.useState(0);

  const slides = [
    { id: "identity", label: "Identity" },
    { id: "nfts", label: "NFT Collection" }
  ];

  const nextSlide = () => {
    playClick();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    playClick();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      <Header
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="container mx-auto px-4 pt-32 pb-32 max-w-6xl relative">
        {/* Carousel Hero Section */}
        <div className="relative group mb-16 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10 overflow-hidden">
          <div className="h-[320px] md:h-[280px] relative">
            <AnimatePresence mode="wait">
              {currentSlide === 0 ? (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 text-center md:text-left">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
                      <img src={pfpFrame} alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none" />
                      <div className="relative w-[75%] h-[75%] mx-auto mt-[12.5%] rounded-full overflow-hidden bg-black/40 z-10">
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
                        {isFitbitConnected && (
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-emerald-400 tracking-tight">
                            <Activity size={12} className="md:w-3.5 md:h-3.5" /> 
                            {`Fitbit: ${fitbitSteps?.toLocaleString() ?? 0}`} steps
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="nfts"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="px-8 py-6 md:px-12 md:py-8 h-full flex flex-col justify-center"
                >
                  <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                  <div className="relative z-10 h-full flex flex-col">
                    <h3 className="text-sm md:text-base text-white/90 mb-4 flex items-center gap-2 tracking-tight">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      NFT Collection
                    </h3>

                    <div className="flex-1 min-h-0 flex items-center">
                      {arcticLoading ? (
                        <div className="flex items-center gap-3 text-white/40 w-full justify-center">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <span className="text-lg font-light">Scanning collection...</span>
                        </div>
                      ) : arcticData.hasNFT ? (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full">
                          {arcticData.nfts.map((nft: any, idx: number) => {
                            const tokenData = nft.current_token_data;
                            let imgUri = tokenData?.token_uri || "";
                            if (imgUri.startsWith('ipfs://')) {
                              imgUri = imgUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                            }

                            return (
                              <div key={idx} className="flex-shrink-0 w-32 md:w-36 group/nft cursor-pointer">
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-black/40 transition-all mb-2">
                                  {imgUri && imgUri.trim() !== "" ? (
                                    <img
                                      src={imgUri}
                                      alt={tokenData?.token_name || "Arctic Penguin"}
                                      className="w-full h-full object-cover group-hover/nft:scale-110 transition-transform duration-500"
                                      onError={(e) => { (e.target as HTMLImageElement).src = userAvatar; }}
                                    />
                                  ) : (
                                    <img
                                      src={userAvatar}
                                      alt="Default Avatar"
                                      className="w-full h-full object-cover opacity-40"
                                    />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/nft:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-[8px] text-white/60 uppercase tracking-widest font-bold">Verified</span>
                                  </div>
                                </div>
                                <div className="text-[11px] text-white font-medium truncate">{tokenData?.token_name || "Arctic Penguin"}</div>
                                <div className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Arctic Collection</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full py-4 text-center bg-white/5 rounded-2xl border border-white/5">
                          <Trophy className="w-8 h-8 text-white/10 mb-2" />
                          <p className="text-white/40 text-sm font-light">No NFTs found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Bottom Control Bar */}
          <div className="absolute bottom-6 left-0 right-0 px-8 flex items-center justify-between z-40">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-blue-500' : 'bg-white/20'}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
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

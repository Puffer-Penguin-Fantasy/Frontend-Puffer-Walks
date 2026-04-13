import { useAccount } from "@razorlabs/razorkit"
import { WalletPanel } from "@/components/WalletPanel"
import React from "react"
import { Trophy, Plus } from "lucide-react"
import { useGame } from "../hooks/useGame"
import { GameCard } from "../components/GameCard"
import { GameCardSkeleton } from "../components/GameCardSkeleton"
import { CreateGameModal } from "../components/CreateGameModal"
import { AdminPanel } from "../components/AdminPanel"
import { Header } from "../components/Header"
import { useSound } from "../hooks/useSound"
import 'ol/ol.css'
import blueBackground from "../assets/blue.jpg"

export default function SettingsPage() {
    const { address: rawAddress } = useAccount()
    const { playClick } = useSound()
    const [isPanelOpen, setIsPanelOpen] = React.useState(false)
    const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [discoverCode, setDiscoverCode] = React.useState("")
    const { games, adminAddress, isLoading: gamesLoading, refresh: refreshGames, joinGame, claimRewards, createGame } = useGame()
    
    const address = rawAddress?.toLowerCase();
    React.useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('fitbit')) {
            url.searchParams.delete('fitbit');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);
    
    // Helper to ensure addresses are compared correctly (handles 0x and case)
    const standardize = (addr: string | null | undefined) => {
        if (!addr) return "";
        let clean = addr.toLowerCase();
        if (!clean.startsWith("0x")) clean = "0x" + clean;
        return clean;
    };

    const isAdmin = address && adminAddress && standardize(address) === standardize(adminAddress);
    
    console.log("🛠️ Admin Check:", { 
        yourAddress: standardize(address), 
        onChainAdmin: standardize(adminAddress), 
        isMatch: isAdmin 
    });

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed text-foreground font-sans selection:bg-blue-600/20"
            style={{ backgroundImage: `url(${blueBackground})` }}
        >
            {/* Shared Header Component */}
            <Header onOpenWallet={() => { playClick(); setIsPanelOpen(true); }} onOpenAdmin={() => { playClick(); setIsAdminPanelOpen(true); }} />

            <div className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
                {/* Hero Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl text-foreground mb-2 tracking-tight">
                            Active Competitions
                        </h1>
                        <p className="text-muted-foreground text-sm tracking-tight">
                            Stake your steps, outwalk the rest, and earn rewards through Movement Network.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <input
                            type="text"
                            placeholder="Enter Join Code"
                            value={discoverCode}
                            onChange={e => setDiscoverCode(e.target.value)}
                            className="w-full md:w-auto h-10 px-6 bg-muted border border-border rounded-full text-sm placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-medium"
                        />
                        {isAdmin && (
                            <button 
                                onClick={() => { playClick(); setIsCreateModalOpen(true); }}
                                className="hidden md:flex flex-shrink-0 items-center justify-center gap-2 px-4 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                <Plus size={16} /> New Game
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gamesLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <GameCardSkeleton key={i} />
                        ))
                    ) : games.length > 0 ? (
                        games
                        .filter(game => {
                            const isSearchTermLongEnough = discoverCode.length > 2;
                            const isCodeMatch = isSearchTermLongEnough && game.joinCode === discoverCode;
                            const isNameMatch = isSearchTermLongEnough && game.name.toLowerCase().includes(discoverCode.toLowerCase());
                            const isJoined = game.participants?.some(p => standardize(p) === standardize(address));
                            
                            // Public games: Always show (but filter by name if searching)
                            if (game.is_public) {
                                return isSearchTermLongEnough ? isNameMatch : true;
                            }
                            
                            // Private games: ONLY show if exact code matches OR user is already joined
                            return isCodeMatch || isJoined;
                        })
                        .map((game) => (
                            <GameCard 
                                key={game.id} 
                                game={game} 
                                globalJoinCode={discoverCode}
                                onJoin={(id, code) => joinGame(id, code)}
                                onClaim={() => claimRewards(game.id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card rounded-[40px] border border-dashed border-border">
                            <Trophy className="w-16 h-16 text-muted/30 mb-6" />
                            <h3 className="text-2xl font-normal text-muted-foreground mb-2 lowercase tracking-tighter">No Active Battles</h3>
                            <p className="text-muted-foreground/60 text-sm mb-6 lowercase">Games created on Movement Network will appear here.</p>
                            <button 
                                onClick={() => { playClick(); refreshGames(); }}
                                className="px-6 py-2 rounded-full bg-muted border border-border text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                            >
                                Reload List
                            </button>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="mt-8 md:hidden">
                        <button 
                            onClick={() => { playClick(); setIsCreateModalOpen(true); }}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-black text-white text-sm hover:bg-gray-800 transition-all"
                        >
                            <Plus size={16} /> Create New Game
                        </button>
                    </div>
                )}
            </div>

            <WalletPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
            
            <AdminPanel 
                isOpen={isAdminPanelOpen} 
                onClose={() => setIsAdminPanelOpen(false)} 
            />
            
            <CreateGameModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSubmit={createGame} 
            />
        </div>
    )
}

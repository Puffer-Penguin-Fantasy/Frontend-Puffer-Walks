import { useAccount } from "@razorlabs/razorkit"
import { WalletPanel } from "@/components/WalletPanel"
import React from "react"
import { Trophy, Plus, Loader2 } from "lucide-react"
import { useGame } from "../hooks/useGame"
import { GameCard } from "../components/GameCard"
import { GameCardSkeleton } from "../components/GameCardSkeleton"
import { CreateGameModal } from "../components/CreateGameModal"
import { AdminPanel } from "../components/AdminPanel"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
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
    const [discoverCodeHash, setDiscoverCodeHash] = React.useState<number[] | null>(null)
    const { games, adminAddress, isLoading: gamesLoading, refresh: refreshGames, joinGame, claimRewards, createGame, hashString } = useGame()
    
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
    
    React.useEffect(() => {
        const updateHash = async () => {
            if (discoverCode.length > 2) {
                const h = await hashString(discoverCode);
                setDiscoverCodeHash(h);
            } else {
                setDiscoverCodeHash(null);
            }
        };
        updateHash();
    }, [discoverCode, hashString]);
    

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
                            className="w-full md:w-auto h-10 px-6 bg-muted border border-border rounded-full text-xs placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-bold"
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

                <div className="space-y-16">
                    {/* Active Games Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {gamesLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <GameCardSkeleton key={i} />
                            ))
                        ) : games.filter(game => {
                            const now = Math.floor(Date.now() / 1000);
                            const isSearchTermLongEnough = discoverCode.length > 2;
                            const isPlaintextMatch = isSearchTermLongEnough && game.join_code && game.join_code.trim().toLowerCase() === discoverCode.trim().toLowerCase();
                            const isHashMatch = isSearchTermLongEnough && discoverCodeHash && Array.isArray(game.join_code_hash) && game.join_code_hash.length === 32 && game.join_code_hash.every((v, i) => v === discoverCodeHash[i]);
                            const isCodeMatch = isPlaintextMatch || isHashMatch;
                            const isNameMatch = isSearchTermLongEnough && game.name.toLowerCase().includes(discoverCode.toLowerCase());
                            const isJoined = game.participants?.some(p => standardize(p) === standardize(address));
                            const isActive = parseInt(game.end_time) >= now;
                            
                            if (game.is_public) return isActive && (isSearchTermLongEnough ? isNameMatch : true);
                            return isActive && (isCodeMatch || isJoined);
                        }).length > 0 ? (
                            games
                            .filter(game => {
                                const now = Math.floor(Date.now() / 1000);
                                const isSearchTermLongEnough = discoverCode.length > 2;
                                const isPlaintextMatch = isSearchTermLongEnough && game.join_code && game.join_code.trim().toLowerCase() === discoverCode.trim().toLowerCase();
                                const isHashMatch = isSearchTermLongEnough && discoverCodeHash && Array.isArray(game.join_code_hash) && game.join_code_hash.length === 32 && game.join_code_hash.every((v, i) => v === discoverCodeHash[i]);
                                const isCodeMatch = isPlaintextMatch || isHashMatch;
                                const isNameMatch = isSearchTermLongEnough && game.name.toLowerCase().includes(discoverCode.toLowerCase());
                                const isJoined = game.participants?.some(p => standardize(p) === standardize(address));
                                const isActive = parseInt(game.end_time) >= now;
                                
                                if (game.is_public) return isActive && (isSearchTermLongEnough ? isNameMatch : true);
                                return isActive && (isCodeMatch || isJoined);
                            })
                            .sort((a, b) => parseInt(b.start_time) - parseInt(a.start_time))
                            .map((game) => (
                                <GameCard 
                                    key={game.id} 
                                    game={game} 
                                    globalJoinCode={discoverCode}
                                    onJoin={(id) => joinGame(id)}
                                    onClaim={() => claimRewards(game.id)}
                                />
                            ))
                        ) : !gamesLoading && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                                <div className="relative z-10 flex flex-col items-center text-center px-6">
                                    <Trophy className="w-8 h-8 text-blue-400/60 mb-4" />
                                    <h3 className="text-xl font-light text-white mb-2">No Active Competitions</h3>
                                    <p className="text-white/40 text-xs max-w-xs">Be the first to launch a new competition or search for another code.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Finished Games Section */}
                    {games.filter(game => {
                        const now = Math.floor(Date.now() / 1000);
                        const isSearchTermLongEnough = discoverCode.length > 2;
                        const isJoined = game.participants?.some(p => standardize(p) === standardize(address));
                        const isFinished = parseInt(game.end_time) < now;
                        return isFinished && (isSearchTermLongEnough ? game.name.toLowerCase().includes(discoverCode.toLowerCase()) : isJoined);
                    }).length > 0 && (
                        <div className="space-y-8">
                            <div className="border-t border-white/10 pt-12">
                                <h2 className="text-xl text-white mb-2 tracking-tight">
                                    Finished Competitions
                                </h2>
                                <p className="text-white/70 text-xs tracking-tight">
                                    Past battles on the Movement Network.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {games
                                .filter(game => {
                                    const now = Math.floor(Date.now() / 1000);
                                    const isSearchTermLongEnough = discoverCode.length > 2;
                                    const isJoined = game.participants?.some(p => standardize(p) === standardize(address));
                                    const isFinished = parseInt(game.end_time) < now;
                                    return isFinished && (isSearchTermLongEnough ? game.name.toLowerCase().includes(discoverCode.toLowerCase()) : isJoined);
                                })
                                .sort((a, b) => parseInt(b.end_time) - parseInt(a.end_time))
                                .map((game) => (
                                    <div key={game.id} className="transition-all">
                                        <GameCard 
                                            game={game} 
                                            globalJoinCode={discoverCode}
                                            onJoin={(id) => joinGame(id)}
                                            onClaim={() => claimRewards(game.id)}
                                        />
                                    </div>
                                ))}
                            </div>
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

            <Footer />
        </div>
    )
}

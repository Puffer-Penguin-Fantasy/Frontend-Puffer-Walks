import { useState } from "react";
import { useAccount } from "@razorlabs/razorkit"
import SettingsIcon from "@mui/icons-material/Settings";
import { Menu, X, } from "lucide-react";
import { useGame } from "../hooks/useGame"
import { useSound } from "../hooks/useSound"
import { useProfile } from "../hooks/useProfile"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
    onOpenWallet: () => void;
    onOpenAdmin?: () => void;
}

import pfpFrame from "../assets/gameframe/pfpframe.png"
import userAvatar from "../assets/user-avatar.png"

export function Header({ onOpenWallet, onOpenAdmin }: HeaderProps) {
    const { address, isConnected } = useAccount()
    const { adminAddress } = useGame()
    const { playClick } = useSound()
    const navigate = useNavigate()
    const normalizedAddress = address?.toLowerCase();
    const { profileImage } = useProfile(normalizedAddress);

    const standardize = (addr: string | null | undefined) => {
        if (!addr) return "";
        let clean = addr.toLowerCase();
        if (!clean.startsWith("0x")) clean = "0x" + clean;
        return clean;
    };

    const isAdmin = normalizedAddress && adminAddress && standardize(normalizedAddress) === standardize(adminAddress);



    const shortAddress = normalizedAddress
        ? normalizedAddress.slice(0, 6) + '...' + normalizedAddress.slice(-4)
        : '';

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-md h-16 flex items-center px-6 border-b border-white/5">
            <div className="w-full flex justify-between items-center max-w-6xl mx-auto">
                <div className="flex items-center gap-6">
                    <div 
                        className="flex items-center cursor-pointer whitespace-nowrap shrink-0" 
                        onClick={() => { playClick(); navigate("/"); }}
                    >
                        <span className="text-base sm:text-xl font-xirod text-foreground tracking-tight">Puffer Walks</span>
                        <span className="ml-1.5 sm:ml-2 px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[7px] sm:text-[9px] text-white/40 uppercase tracking-widest whitespace-nowrap">
                            beta mainnet
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center border-l border-white/10 pl-6">
                        <button 
                            onClick={() => { playClick(); navigate("/leaderboard"); }}
                            className="text-xs font-light text-white/40 hover:text-white transition-colors tracking-wide"
                        >
                            Leaderboard
                        </button>
                    </nav>
                </div>

                {/* Right: Actions & Menu */}
                <div className="flex items-center gap-2 md:gap-4">
                    {isConnected && (
                        <button
                            onClick={() => { playClick(); onOpenWallet(); }}
                            className="hidden sm:flex px-4 py-1.5 rounded-full bg-muted hover:bg-muted/80 border border-border transition-all items-center gap-2 group"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-xs font-bold text-white/70 tracking-tight group-hover:text-blue-400 transition-colors">
                                {shortAddress}
                            </span>
                        </button>
                    )}

                    {isAdmin && onOpenAdmin && (
                        <button
                            onClick={() => { playClick(); onOpenAdmin(); }}
                            className="w-10 h-10 rounded-full bg-muted text-foreground border border-border flex items-center justify-center hover:bg-muted/80 transition-all shadow-sm"
                            title="Admin Protocol Settings"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    )}

                    {/* Profile Picture */}
                    <div
                        id="step-wallet"
                        className="relative w-10 h-10 md:w-11 md:h-11 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                        onClick={() => { playClick(); onOpenWallet(); }}
                    >
                        <img src={pfpFrame} alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none" />
                        <div className="relative w-[75%] h-[75%] overflow-hidden rounded-full bg-muted flex items-center justify-center z-10">
                            <img src={profileImage || userAvatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Hamburger Toggle */}
                    <button
                        onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }}
                        className="md:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                        {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
                    </button>
                </div>

                {/* Professional Minimal Dropdown (Mobile Only) */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 top-16 z-[1001] bg-black/60 md:hidden"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed top-16 left-0 right-0 z-[1002] bg-[#0d1117] border-b border-white/10 shadow-2xl py-8 px-8 md:hidden"
                            >
                                <div className="max-w-6xl mx-auto flex flex-col gap-6">
                                    <nav className="flex flex-col gap-6">
                                        <button
                                            onClick={() => { playClick(); navigate("/"); setIsMenuOpen(false); }}
                                            className="text-lg font-light text-white/70 hover:text-white transition-colors text-left"
                                        >
                                            Home
                                        </button>
                                        <button
                                            onClick={() => { playClick(); navigate("/leaderboard"); setIsMenuOpen(false); }}
                                            className="text-lg font-light text-white/70 hover:text-white transition-colors text-left"
                                        >
                                            Leaderboard
                                        </button>
                                        {isAdmin && onOpenAdmin && (
                                            <button
                                                onClick={() => { playClick(); onOpenAdmin(); setIsMenuOpen(false); }}
                                                className="text-lg font-light text-white/70 hover:text-white transition-colors text-left"
                                            >
                                                Admin Settings
                                            </button>
                                        )}
                                    </nav>

                                    {!isConnected && (
                                        <div className="pt-8 border-t border-white/5">
                                            <button
                                                onClick={() => { playClick(); onOpenWallet(); setIsMenuOpen(false); }}
                                                className="w-full h-14 bg-white text-black font-bold rounded-xl flex items-center justify-center active:scale-[0.98] transition-all"
                                            >
                                                Connect Wallet
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </header>
    )
}

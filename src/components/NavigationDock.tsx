"use client";

import React from "react";
import { 
  Home, 
  Pin, 
  Info,
  Loader2
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { motion } from "framer-motion";

import { useGame } from "../hooks/useGame";
import { useParams, useLocation } from "react-router-dom";

// Simplified Dock implementation for the Puffer aesthetic
export function NavigationDock() {
  const [activeTab, setActiveTab] = React.useState("home");
  const { pinUser } = useGame();
  const { id: gameId } = useParams();
  const location = useLocation();
  const [isPinning, setIsPinning] = React.useState(false);

  const isLeaderboardPage = location.pathname.startsWith("/leaderboard");

  const handlePin = async () => {
    if (!gameId) return alert("Select a game to pin!");
    setIsPinning(true);
    try {
      await pinUser(gameId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinning(false);
    }
  };

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] px-4">
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center gap-1.5 p-1.5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
          
          {/* Main Nav */}
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "relative p-2.5 rounded-full transition-all duration-300 group",
                    activeTab === item.id 
                      ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  <item.icon size={18} />
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-full bg-blue-500/10 blur-md -z-10"
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#161b22] border-white/10 text-white text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}

          {isLeaderboardPage && (
            <>
              <div className="w-[1px] h-5 bg-white/10 mx-1" />

              {/* Premium Pin Action */}
              <div className="flex items-center gap-1 group/pin bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-full pl-0.5 pr-2.5 py-0.5 transition-all duration-300">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={handlePin}
                      disabled={isPinning}
                      className="p-2 rounded-full text-amber-500 hover:scale-110 transition-transform disabled:opacity-50"
                    >
                      {isPinning ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Pin size={16} fill="currentColor" className="fill-amber-500/20" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1c1602] border-amber-500/20 text-amber-200 text-xs max-w-[200px] p-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-bold flex items-center gap-1">
                        <Pin size={12} className="text-amber-500" /> Premium Pin
                      </div>
                      <p className="opacity-70 leading-relaxed">
                        Boost your game to the top of the leaderboard for 3 full weeks.
                      </p>
                      <div className="mt-1 text-amber-400 font-mono text-[10px]">Cost: 200 MOVE</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
                
                <span className="text-[10px] font-bold text-amber-500/70 tracking-tighter whitespace-nowrap ml-1">
                  Pin Me
                </span>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity ml-1.5">
                      <Info size={11} className="text-amber-200" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black border-white/10 text-[10px] text-white/60">
                    Promoted games get 10x more visibility.
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

        </div>
      </TooltipProvider>
    </div>
  );
}

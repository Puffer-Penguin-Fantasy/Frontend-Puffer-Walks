import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import type { Game } from "../types/game";
import { useAccount } from "@razorlabs/razorkit";
import { useSound } from "../hooks/useSound";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  game: Game;
  onJoin: (id: string, code?: string) => void;
  onClaim: (id: string) => void;
  globalJoinCode?: string;
}

export function GameCard({ game, onJoin, onClaim, globalJoinCode }: GameCardProps) {
  const { address: rawAddress } = useAccount();
  const { playClick } = useSound();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = React.useState(false);
  const [isClaiming, setIsClaiming] = React.useState(false);
  const depositInMove = (parseFloat(game.deposit_amount) / 100_000_000).toFixed(2);
  const totalPool = ((parseFloat(game.prize_pool) + parseFloat(game.sponsored_pool)) / 100_000_000).toFixed(2);
  const startTime = new Date(parseInt(game.start_time) * 1000);
  const endTime = new Date(parseInt(game.end_time) * 1000);
  // Subtract 1 second to get the last active day (e.g., if it ends at 00:00 on the 13th, the last active day is the 12th)
  const displayEndDate = new Date(endTime.getTime() - 1000);
  const now = new Date();

  // Standardize address for comparison
  const standardize = (addr: string | null | undefined) => {
    if (!addr) return "";
    let clean = addr.toLowerCase();
    if (!clean.startsWith("0x")) clean = "0x" + clean;
    return clean;
  };

  const userAddr = standardize(rawAddress);
  const isJoined = game.participants?.some(p => standardize(p) === userAddr);


  const isUpcoming = startTime > now;
  const isActive = startTime <= now && endTime > now;
  const isSummarising = endTime <= now && now.getTime() < endTime.getTime() + (48 * 60 * 60 * 1000);
  const isPostGame = endTime <= now && !isSummarising;

  const calculateClaimableReward = () => {
    if (!game.days_completed) return "0.00";
    
    let payout = 0;
    const noOfDays = parseInt(game.no_of_days);
    
    for (let i = 0; i < noOfDays; i++) {
        const met = game.days_completed[i];
        if (met) {
            const dayStake = (i === noOfDays - 1) ? parseInt(game.daily_stake_final) : parseInt(game.daily_stake_standard);
            payout += dayStake;
            
            const dayWinners = parseInt(game.day_winners_count[i] || "0");
            const forfeitedPool = parseInt(game.daily_forfeited_pool[i] || "0");
            if (dayWinners > 0) {
                payout += Math.floor(forfeitedPool / dayWinners);
            }
        }
    }
    
    let perfectBonus = 0;
    if (game.userMissedDays === 0 && parseInt(game.perfect_winners_count) > 0) {
        const sponsoredVault = parseInt(game.sponsored_pool);
        perfectBonus = Math.floor(sponsoredVault / parseInt(game.perfect_winners_count));
    }
    
    return ((payout + perfectBonus) / 100_000_000).toFixed(2);
  };

  const claimableReward = calculateClaimableReward();

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJoining(true);
    try {
      playClick();
      await onJoin(game.id);
    } catch (err) {
      console.error("Join failed:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClaiming(true);
    try {
      playClick();
      await onClaim(game.id);
    } catch (err) {
      console.error("Claim failed:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div 
      onClick={() => {
        playClick();
        navigate(`/leaderboard/${game.slug}`);
      }}
      className="bg-black/40 backdrop-blur-xl rounded-[24px] border border-white/10 transition-all duration-300 group cursor-pointer flex flex-col w-full overflow-hidden shadow-xl hover:shadow-2xl hover:border-white/20"
    >
      {/* Header Row: Avatar | Title | Button */}
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {game.image_url && game.image_url.trim() !== "" && (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
               <img 
                  src={game.image_url} 
                  alt={game.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500"
                />
            </div>
          )}
          <div className="min-w-0 pr-2 flex-1">
            <h3 className="text-base font-bold text-white leading-tight">
              {game.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-blue-400">
                {totalPool} Move
              </span>
              {game.is_sponsored && (
                <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-tight">Sponsored</span>
              )}
              {!game.is_public && (
                <span className="bg-white/10 text-white/50 px-1.5 py-0.5 rounded-md text-[9px] font-normal tracking-tight">Private</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button at Top-Right */}
        <div className="flex-shrink-0">
          {isUpcoming && (
            isJoined ? (
              <div
                className="px-4 py-2 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default"
              >
                <CheckCircle size={14} /> Joined
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={(!game.is_public && !globalJoinCode) || isJoining}
                className={`flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl text-[11px] font-bold tracking-tight transition-all active:scale-95 ${
                  (!game.is_public && !globalJoinCode) || isJoining
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {isJoining ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    joining...
                  </>
                ) : "Join"}
              </button>
            )
          )}
          {isSummarising && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-medium flex items-center gap-1.5 cursor-default">
              <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
              summarising
            </div>
          )}
          {isPostGame && (
            isJoined ? (
              game.isClaimed ? (
                <div className="px-4 py-2 rounded-xl bg-white/5 text-white/40 border border-white/10 text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default">
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-full" /> Claimed
                </div>
              ) : (game.userCompletedDays === 0) ? (
                <div className="px-4 py-2 rounded-xl bg-white/5 text-white/40 border border-white/10 text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default">
                    0 days hit
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[11px] font-bold transition-all active:scale-95 shadow-sm hover:bg-blue-600 flex items-center justify-center gap-1.5 min-w-[80px]"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      {claimableReward}
                      <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3 h-3 rounded-full" loading="lazy" decoding="async" alt="MOVE" />
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="flex items-center gap-1 bg-white/5 text-white/40 px-3 py-2 rounded-xl text-[11px] font-normal border border-white/10 cursor-default">
                Ended
              </div>
            )
          )}
          {isActive && (
            <div className="flex items-center gap-1 bg-green-400/10 text-green-400 px-3 py-2 rounded-xl text-[11px] font-normal border border-green-400/20">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
               Active
            </div>
          )}
        </div>
      </div>

      {/* Stats Row: The "Internal Card" (Flush, Darker, Taller) */}
      <div className="bg-white/5 p-7 px-5 grid grid-cols-4 gap-2 items-center border-t border-white/10 rounded-t-xl mt-auto relative overflow-hidden">
        {game.is_sponsored && game.sponsor_image_url && game.sponsor_image_url.trim() !== "" && (
          <div className="absolute top-0 right-0 p-1 px-3 bg-amber-500/10 rounded-bl-xl flex items-center gap-1.5">
            <span className="text-[8px] font-medium text-amber-500 lowercase tracking-tight">sponsored by</span>
            <img src={game.sponsor_image_url} alt={game.sponsor_name} loading="lazy" decoding="async" className="w-3.5 h-3.5 rounded-full object-cover" />
            <span className="text-[9px] font-semibold text-amber-500 leading-none">{game.sponsor_name}</span>
          </div>
        )}
        
        <div className="flex flex-col items-center min-w-0">
          <span className="text-[9px] text-white/40 font-normal tracking-tight mb-0.5 whitespace-nowrap">Entry Fee</span>
          <div className="flex items-center gap-1">
             <span className="text-sm font-bold text-white">
               {parseFloat(depositInMove).toFixed(0)}
             </span>
             <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3 h-3 rounded-full" loading="lazy" decoding="async" alt="MOVE" />
             <span className="text-[10px] text-blue-400 font-bold whitespace-nowrap">+10</span>
          </div>
        </div>
        <div className="flex flex-col items-center border-l border-white/10 pl-1">
          <span className="text-[9px] text-white/40 font-normal lowercase tracking-tight mb-0.5">{game.no_of_days} days</span>
          <span className="text-[12px] font-medium text-white">{startTime.getUTCMonth() + 1}/{startTime.getUTCDate()} - {displayEndDate.getUTCDate() === startTime.getUTCDate() && game.no_of_days === "1" ? "" : `${displayEndDate.getUTCMonth() + 1}/`}{displayEndDate.getUTCDate()}</span>
        </div>
        <div className="flex flex-col items-center border-l border-white/10 pl-1">
          <span className="text-[9px] text-white/40 font-normal lowercase tracking-tight mb-0.5">steps</span>
          <span className="text-sm font-medium text-white">{parseInt(game.min_daily_steps) >= 1000 ? `${parseInt(game.min_daily_steps)/1000}k` : game.min_daily_steps}</span>
        </div>
        <div className="flex flex-col items-center border-l border-white/10 pl-1">
          <span className="text-[9px] text-white/40 font-normal tracking-tight mb-0.5">Players</span>
          <span className="text-sm font-medium text-white">
            {game.participants?.length || game.participants_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

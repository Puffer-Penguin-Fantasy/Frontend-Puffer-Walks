import { CheckCircle } from "lucide-react";
import type { Game } from "../types/game";
import { useAccount } from "@razorlabs/razorkit";

interface GameCardProps {
  game: Game;
  onJoin: (id: string, code: string) => void;
  onClaim: (id: string) => void;
  globalJoinCode?: string;
}

export function GameCard({ game, onJoin, onClaim, globalJoinCode }: GameCardProps) {
  const { address: rawAddress } = useAccount();
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
  const isEnded = endTime <= now;

  return (
    <div 
      onClick={() => window.location.href = `/leaderboard/${game.slug}`}
      className="bg-card rounded-[24px] border-2 border-border transition-all duration-300 group cursor-pointer flex flex-col w-full overflow-hidden shadow-sm hover:shadow-md"
    >
      {/* Header Row: Avatar | Title | Button */}
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {game.image_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
               <img 
                  src={game.image_url} 
                  alt={game.name} 
                  className="w-full h-full object-cover transition-transform duration-500"
                />
            </div>
          )}
          <div className="min-w-0 pr-2 flex-1">
            <h3 className="text-base font-medium text-foreground leading-tight">
              {game.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-normal text-accent">
                {totalPool} Move
              </span>
              {game.is_sponsored && (
                <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-tight">Sponsored</span>
              )}
              {!game.is_public && (
                <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-md text-[9px] font-normal tracking-tight">Private</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button at Top-Right */}
        <div className="flex-shrink-0">
          {isUpcoming && (
            isJoined ? (
              <div
                className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default"
              >
                <CheckCircle size={14} /> Joined
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onJoin(game.id, globalJoinCode || ""); }}
                disabled={!game.is_public && !globalJoinCode}
                className={`px-6 py-2 rounded-xl text-[11px] font-normal tracking-tight transition-all active:scale-95 ${
                  !game.is_public && !globalJoinCode
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                Join
              </button>
            )
          )}
          {isEnded && (
            isJoined ? (
              game.isClaimed ? (
                <div className="px-4 py-2 rounded-xl bg-muted text-muted-foreground border border-border text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default">
                   <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" /> Claimed
                </div>
              ) : (game.userCompletedDays === 0) ? (
                <div className="px-4 py-2 rounded-xl bg-muted text-muted-foreground border border-border text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default">
                    0 days hit
                 </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onClaim(game.id); }}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-[11px] font-normal transition-all active:scale-95 shadow-sm hover:bg-green-700"
                >
                  Claim All
                </button>
              )
            ) : (
              <div className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-2 rounded-xl text-[11px] font-normal border border-border cursor-default">
                 Ended
              </div>
            )
          )}
          {isActive && (
            <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-2 rounded-xl text-[11px] font-normal border border-green-500/20">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               Active
            </div>
          )}
        </div>
      </div>

      {/* Stats Row: The "Internal Card" (Flush, Darker, Taller) */}
      <div className="bg-muted p-7 px-5 grid grid-cols-4 gap-2 items-center border-t border-border rounded-t-xl mt-auto relative overflow-hidden">
        {game.is_sponsored && game.sponsor_image_url && (
          <div className="absolute top-0 right-0 p-1 px-3 bg-amber-500/10 rounded-bl-xl flex items-center gap-1.5">
            <span className="text-[8px] font-medium text-amber-500 lowercase tracking-tight">sponsored by</span>
            <img src={game.sponsor_image_url} alt={game.sponsor_name} className="w-3.5 h-3.5 rounded-full object-cover" />
            <span className="text-[9px] font-semibold text-amber-500 leading-none">{game.sponsor_name}</span>
          </div>
        )}
        
        <div className="flex flex-col items-center min-w-0">
          <span className="text-[9px] text-muted-foreground font-normal lowercase tracking-tight mb-0.5 whitespace-nowrap">entry fee</span>
          <div className="flex items-center gap-1">
             <span className="text-xs font-medium text-foreground">
               {parseFloat(depositInMove).toFixed(0)}
             </span>
             <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3 h-3 rounded-full" alt="MOVE" />
             <span className="text-[8px] text-accent font-medium whitespace-nowrap">+10</span>
          </div>
        </div>
        <div className="flex flex-col items-center border-l border-border pl-1">
          <span className="text-[9px] text-muted-foreground font-normal lowercase tracking-tight mb-0.5">{game.no_of_days} days</span>
          <span className="text-[10px] font-normal text-foreground">{startTime.getUTCMonth() + 1}/{startTime.getUTCDate()} - {displayEndDate.getUTCDate() === startTime.getUTCDate() && game.no_of_days === "1" ? "" : `${displayEndDate.getUTCMonth() + 1}/`}{displayEndDate.getUTCDate()}</span>
        </div>
        <div className="flex flex-col items-center border-l border-border pl-1">
          <span className="text-[9px] text-muted-foreground font-normal lowercase tracking-tight mb-0.5">steps</span>
          <span className="text-xs font-normal text-foreground">{parseInt(game.min_daily_steps) >= 1000 ? `${parseInt(game.min_daily_steps)/1000}k` : game.min_daily_steps}</span>
        </div>
        <div className="flex flex-col items-center border-l border-border pl-1">
          <span className="text-[9px] text-muted-foreground font-normal lowercase tracking-tight mb-0.5">players</span>
          <span className="text-xs font-normal text-foreground">
            {game.participants?.length || game.participants_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

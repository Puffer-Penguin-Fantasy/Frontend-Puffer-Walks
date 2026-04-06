import { CheckCircle } from "lucide-react";
import type { Game } from "../types/game";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface GameCardProps {
  game: Game;
  onJoin: (id: string, code: string) => void;
  onClaim: (id: string) => void;
  globalJoinCode?: string;
}

export function GameCard({ game, onJoin, onClaim, globalJoinCode }: GameCardProps) {
  const { account } = useWallet();
  const depositInMove = (parseFloat(game.deposit_amount) / 100_000_000).toFixed(2);
  const totalPool = ((parseFloat(game.prize_pool) + parseFloat(game.sponsored_pool)) / 100_000_000).toFixed(2);
  const startTime = new Date(parseInt(game.start_time) * 1000);
  const endTime = new Date(parseInt(game.end_time) * 1000);
  const now = new Date();

  // Standardize address for comparison
  const standardize = (addr: string | null | undefined) => {
    if (!addr) return "";
    let clean = addr.toLowerCase();
    if (!clean.startsWith("0x")) clean = "0x" + clean;
    return clean;
  };

  const userAddr = standardize(account?.address?.toString());
  const isJoined = game.participants?.some(p => standardize(p) === userAddr);


  const isUpcoming = startTime > now;
  const isActive = startTime <= now && endTime > now;
  const isSummarising = endTime <= now && now.getTime() < endTime.getTime() + 48 * 60 * 60 * 1000;
  const isEnded = endTime <= now && !isSummarising;

  return (
    <div 
      onClick={() => window.location.href = `/leaderboard/${game.slug}`}
      className="bg-white rounded-[24px] border border-gray-100 transition-all duration-300 group cursor-pointer flex flex-col w-full overflow-hidden"
    >
      {/* Header Row: Avatar | Title | Button */}
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {game.image_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white ring-2 ring-blue-50">
               <img 
                  src={game.image_url} 
                  alt={game.name} 
                  className="w-full h-full object-cover transition-transform duration-500"
                />
            </div>
          )}
          <div className="min-w-0 pr-2 flex-1">
            <h3 className="text-base font-normal text-gray-900 leading-tight">
              {game.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-normal text-blue-500">
                {totalPool} Move
              </span>
              {!game.is_public && (
                <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md text-[9px] font-normal tracking-tight">Private</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button at Top-Right */}
        <div className="flex-shrink-0">
          {isUpcoming && (
            isJoined ? (
              <div
                className="px-4 py-2 rounded-xl bg-green-50 text-emerald-600 border border-emerald-100 text-[11px] font-normal flex items-center justify-center gap-1.5 cursor-default"
              >
                <CheckCircle size={14} /> Joined
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onJoin(game.id, globalJoinCode || ""); }}
                disabled={!game.is_public && !globalJoinCode}
                className={`px-6 py-2 rounded-xl text-[11px] font-normal tracking-tight transition-all active:scale-95 ${
                  !game.is_public && !globalJoinCode
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white"
                }`}
              >
                Join
              </button>
            )
          )}
          {isSummarising && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[11px] font-normal border border-amber-100 cursor-default transition-all">
               <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
               Summarising
            </div>
          )}
          {isEnded && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim(game.id); }}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-[11px] font-normal transition-all active:scale-95"
            >
              Claim
            </button>
          )}
          {isActive && (
            <div className="flex items-center gap-1 bg-gray-50 text-gray-400 px-3 py-2 rounded-xl text-[11px] font-normal border border-gray-100">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
               Active
            </div>
          )}
        </div>
      </div>

      {/* Stats Row: The "Internal Card" (Flush, Darker, Taller) */}
      <div className="bg-gray-100 p-7 px-5 grid grid-cols-4 gap-2 items-center border-t border-gray-100 rounded-t-xl mt-auto">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-500 font-normal lowercase tracking-tight mb-0.5">entry</span>
          <div className="flex items-center gap-1">
             <span className="text-xs font-normal text-gray-800">{parseFloat(depositInMove).toFixed(0)}<span className="text-[10px] text-gray-400 ml-0.5">+10</span></span>
             <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3.5 h-3.5 rounded-full" alt="MOVE" />
          </div>
        </div>
        <div className="flex flex-col items-center border-l border-gray-200 pl-1">
          <span className="text-[9px] text-gray-500 font-normal lowercase tracking-tight mb-0.5">{game.no_of_days} days</span>
          <span className="text-[10px] font-normal text-gray-700">{startTime.getMonth() + 1}/{startTime.getDate()} - {endTime.getMonth() + 1}/{endTime.getDate()}</span>
        </div>
        <div className="flex flex-col items-center border-l border-gray-200 pl-1">
          <span className="text-[9px] text-gray-500 font-normal lowercase tracking-tight mb-0.5">steps</span>
          <span className="text-xs font-normal text-gray-800">{parseInt(game.min_daily_steps) >= 1000 ? `${parseInt(game.min_daily_steps)/1000}k` : game.min_daily_steps}</span>
        </div>
        <div className="flex flex-col items-center border-l border-gray-200 pl-1">
          <span className="text-[9px] text-gray-500 font-normal lowercase tracking-tight mb-0.5">players</span>
          <span className="text-xs font-normal text-gray-800">
            {game.participants?.length || game.participants_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

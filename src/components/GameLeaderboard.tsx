import { useEffect, useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { FlickeringGrid } from "./FlickeringGrid";

import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { useAccount } from "@razorlabs/razorkit";
import { useGamesContext } from "./GamesProvider";
import {
  Users,
  Trophy,
  Pin,
  Info,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';

interface Participant {
  walletAddress: string;
  username: string;
  profileImage: string | null;
  joinedAt: any;
  days: Record<string, number | null>;
  isPinned?: boolean;
  pinnedUntil?: number;
}

interface RankedParticipant extends Participant {
  totalSteps: number;
  daysHitTarget: number;
  rank: number;
}

interface GameLeaderboardProps {
  numDays: number;
  gameName: string;
  minDailySteps: number;
  status: 'upcoming' | 'live' | 'summarising' | 'ended';
  startTime: Date;
  imageUrl?: string | null;
  entryDeposit: number;
  sponsorName?: string;
  sponsorImageUrl?: string;
  gameId: string;
}

const RANK_COLORS = [
  "from-yellow-400 to-amber-500",   // 1st
  "from-gray-300 to-gray-400",       // 2nd
  "from-amber-600 to-amber-700",     // 3rd
];

function ParticipantProfile({ fallbackName, isMe, isPodium, rank, isPinned, profile }: {
  fallbackName: string,
  isMe: boolean,
  isPodium: boolean,
  rank: number,
  isPinned?: boolean,
  profile?: { username: string | null, profileImage: string | null }
}) {
  const username = profile?.username || fallbackName;
  const pfp = profile?.profileImage;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-normal ${isMe ? "" : isPodium ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]}` : "bg-muted"
          }`}
      >
        {pfp && pfp.trim() !== "" ? (
          <img src={pfp} alt={username} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <span className={isPodium ? "text-white" : "text-muted-foreground"}>
            {username?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex items-center gap-1.5">
        <div className={`text-xs font-semibold truncate max-w-[120px] ${isMe ? "text-blue-400" : "text-foreground"}`}>
          {username}
        </div>
        {isPinned && <Pin size={10} className="text-amber-400 fill-amber-400/50" />}
      </div>
      {isMe && (
        <span className="ml-1 text-[8px] bg-blue-400/20 text-blue-400 font-bold px-1.5 py-0.5 rounded-full shrink-0 lowercase border border-blue-400/30">
          you
        </span>
      )}
    </div>
  );
}

export function GameLeaderboard({
  numDays,
  gameName,
  minDailySteps,
  status,
  startTime,
  imageUrl,
  entryDeposit,
  sponsorName,
  sponsorImageUrl,
  gameId,
}: GameLeaderboardProps) {
  const { address } = useAccount();
  const { pinUser, games, userProfiles, fetchProfiles } = useGamesContext();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const myAddress = address?.toLowerCase();
  
  // Batch fetch profiles when participants change
  useEffect(() => {
    if (participants.length === 0) return;
    const uniqueAddrs = participants.map(p => p.walletAddress).filter(Boolean);
    fetchProfiles(uniqueAddrs);
  }, [participants, fetchProfiles]);

  const me = participants.find(p => p.walletAddress?.toLowerCase() === myAddress);
  const hasActivePin = !!(me?.isPinned && me?.pinnedUntil && me?.pinnedUntil > Date.now());

  useEffect(() => {
    if (!gameId) return;
    setParticipants([]); // Reset to avoid stale check across games
    const ref = collection(db, "games", gameId, "participants");
    const unsub = onSnapshot(ref, {
      next: async (snap) => {
        const data = snap.docs.map((d) => d.data() as Participant);
        setParticipants(data);

        // Backfill: ensure all existing participants have a full days template
        const backfills = snap.docs
          .filter((d) => {
            const p = d.data();
            // backfill if days is missing OR doesn't have all expected day keys
            const hasDays = p.days && Object.keys(p.days).length >= numDays;
            return !hasDays;
          })
          .map((d) => {
            const existing = (d.data().days || {}) as Record<string, number>;
            const initialDays: Record<string, number> = {};
            for (let i = 1; i <= numDays; i++) {
              initialDays[`day${i}`] = existing[`day${i}`] ?? 0;
            }
            return setDoc(
              doc(db, "games", gameId, "participants", d.id),
              { days: initialDays },
              { merge: true }
            );
          });
        if (backfills.length > 0) await Promise.all(backfills);
      }
    });
    return () => unsub();
  }, [gameId, numDays]);

  const startDate = startTime;
  const endDate = new Date(startTime.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000);
  
  // Format dates strictly in UTC to match contract logic
  const startDay = startDate.getUTCDate();
  const startMonth = startDate.getUTCMonth() + 1;
  const endDay = endDate.getUTCDate();
  const endMonth = endDate.getUTCMonth() + 1;
  const dayColumns = Array.from({ length: numDays }, (_, i) => i + 1);

  const ranked: RankedParticipant[] = participants
    .map((p) => {
      const totalSteps = dayColumns.reduce((sum, d) => {
        const s = p.days?.[`day${d}`];
        return sum + (typeof s === "number" ? s : 0);
      }, 0);
      const daysHitTarget = dayColumns.filter((d) => {
        const s = p.days?.[`day${d}`];
        return typeof s === "number" && s >= minDailySteps;
      }).length;

      // Check if pin is still valid (casting to strict boolean to fix TS error)
      const hasValidPin = !!(p.isPinned && p.pinnedUntil && p.pinnedUntil > Date.now());

      return { ...p, totalSteps, daysHitTarget, rank: 0, isPinned: hasValidPin };
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.totalSteps - a.totalSteps || b.daysHitTarget - a.daysHitTarget;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const shortAddr = (addr: string) =>
    addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "--";

  const currentDayIdx = useMemo(() => {
    const s = new Date(startTime);
    s.setUTCHours(0, 0, 0, 0);
    const n = new Date();
    const diff = n.getTime() - s.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [startTime]);

  const columns = useMemo<MRT_ColumnDef<RankedParticipant>[]>(() => [
    {
      accessorKey: 'rank',
      header: '#',
      size: 40,
      muiTableHeadCellProps: {
        sx: {
          paddingLeft: '24px',
          paddingRight: '4px',
          textAlign: 'left',
          fontWeight: '700',
          color: 'var(--color-foreground)',
          fontSize: '10px',
          backgroundColor: '#071226 !important',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1) !important',
        },
      },
      muiTableBodyCellProps: {
        sx: {
          paddingLeft: '24px',
          paddingRight: '4px',
          textAlign: 'left',
          color: 'var(--color-foreground)',
          borderBottom: 'none',
        },
      },
      Cell: ({ cell, row }) => (
        <div style={{ position: 'static' }}>
          {row.original.isPinned && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 0,
              opacity: 0.8,
              overflow: 'hidden'
            }}>
              <FlickeringGrid
                squareSize={3}
                gridGap={5}
                flickerChance={0.08}
                color="251, 191, 36"
                maxOpacity={0.3}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
          <span
            style={{ position: 'relative', zIndex: 1 }}
            className={`text-[12px] font-bold ${(row.original.walletAddress?.toLowerCase() === myAddress) ? 'text-blue-400' : 'text-foreground'}`}
          >
            {cell.getValue<number>()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Player',
      size: 180,
      muiTableHeadCellProps: {
        sx: {
          paddingLeft: '0px',
          fontWeight: '700',
          color: 'var(--color-foreground)',
          backgroundColor: '#071226 !important',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1) !important',
        },
      },
      muiTableBodyCellProps: {
        sx: {
          paddingLeft: '0px',
          color: 'var(--color-foreground)',
          borderBottom: 'none',
        },
      },
      Cell: ({ row }) => (
        <ParticipantProfile
            fallbackName={row.original.username || shortAddr(row.original.walletAddress)}
            isMe={row.original.walletAddress?.toLowerCase() === myAddress}
            isPodium={row.original.rank <= 3}
            rank={row.original.rank}
            isPinned={row.original.isPinned}
            profile={userProfiles[row.original.walletAddress?.toLowerCase() || ""]}
        />
      ),
    },
    ...dayColumns.map((d): MRT_ColumnDef<RankedParticipant> => ({
      id: `day${d}`,
      accessorFn: (row) => row.days ? row.days[`day${d}`] : undefined,
      header: `Day ${d}`,
      size: 90,
      muiTableHeadCellProps: {
        sx: {
          backgroundColor: '#071226 !important',
          color: 'var(--color-foreground)',
          fontWeight: '700',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1) !important',
        },
      },
      Cell: ({ cell }: { cell: any }) => {
        const steps = cell.getValue() as number | null;
        const hitTarget = (steps || 0) >= minDailySteps;
        const isPastDay = (d - 1) < currentDayIdx;
        const isFailed = isPastDay && !hitTarget;

        let textColor = 'text-muted-foreground/60';
        if (hitTarget) textColor = 'text-blue-400';
        else if (isFailed) textColor = 'text-red-500';

        return (
          <span className={`text-[12px] tabular-nums font-semibold ${textColor}`}>
            {(steps !== null && steps !== undefined) ? steps.toLocaleString() : "—"}
          </span>
        );
      },
    })),
  ], [dayColumns, minDailySteps, myAddress, currentDayIdx]);

  const table = useMaterialReactTable({
    columns,
    data: ranked,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableRowSelection: false,
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '0',
        backgroundColor: 'transparent',
      },
    },
    muiTableProps: {
      sx: {
        border: 'none',
        '& td, & th': {
          border: 'none !important',
        },
      },
    },
    muiTableHeadProps: {
      sx: {
        border: 'none',
        backgroundColor: '#071226 !important',
      },
    },
    muiTableBodyRowProps: ({ row }) => {
      const isMe = row.original.walletAddress?.toLowerCase() === myAddress;
      const isPinned = row.original.isPinned;
      return {
        hover: false,
        className: isPinned ? 'pinned-row-beam' : '',
        sx: {
          backgroundColor: isMe ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
          '&:hover': {
            backgroundColor: isMe ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
          },
          border: 'none !important',
          transition: 'none',
          color: 'var(--color-foreground)',
          position: 'relative',
        },
      };
    },
    muiTableHeadCellProps: {
      sx: {
        fontSize: '10px',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '16px 12px',
        backgroundColor: '#071226 !important',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1) !important',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '8px 12px',
        border: 'none !important',
        fontSize: '12px',
        color: 'var(--color-foreground)',
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: 'none',
        backgroundColor: 'transparent',
      },
    },

    renderEmptyRowsFallback: () => (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Users size={32} className="text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground lowercase">no participants found</p>
      </div>
    ),
  });


  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* Sponsor Area (Separate Compact Minimalist Card) */}
      {!!sponsorName && (
        <div className="flex justify-center mb-0">
          <div className="flex items-center gap-3 py-4 px-6 rounded-3xl transition-all">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {sponsorImageUrl && sponsorImageUrl.trim() !== "" ? (
                <img src={sponsorImageUrl} alt={sponsorName} loading="lazy" decoding="async" className="w-full h-full object-contain grayscale opacity-60 invert" />
              ) : (
                <Trophy className="text-muted-foreground/30" size={20} />
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] font-normal lowercase tracking-wide mb-0.5">sponsored by</span>
              <h4 className="text-foreground text-sm md:text-md font-medium tracking-tight whitespace-nowrap lowercase">
                {sponsorName}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col w-full overflow-hidden relative shadow-2xl">
        {/* Header Hero Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                {imageUrl && imageUrl.trim() !== "" ? (
                  <img src={imageUrl} alt={gameName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white font-bold text-xl uppercase">
                    {gameName?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight mb-1">
                  {gameName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Premium Pin Action Pill */}
              {!hasActivePin && (
                <div className="flex items-center gap-1 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-full pl-0.5 pr-1.5 duration-300">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={async () => {
                          const idToPin = games.find(g => g.name === gameName || g.id === gameId)?.id;
                          if (!idToPin) return alert("Game not found.");
                          try {
                            await pinUser(idToPin);
                          } catch (e: any) {
                            const msg = e.message || "";
                            if (msg.includes("simulation")) {
                              alert("Transaction simulation failed. Please ensure you have enough MOVE tokens for the 200 MOVE fee.");
                            } else {
                              alert("Failed to pin. Please try again.");
                            }
                          }
                        }}
                        className="flex items-center gap-1 p-2 rounded-full text-amber-500 hover:scale-105 transition-all text-[10px] font-bold"
                      >
                        <Pin size={16} fill="currentColor" className="fill-amber-500/20" />
                        <span className="tracking-tighter whitespace-nowrap ml-1 font-xirod text-[8px]">
                          Pin Me
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#1c1602] border-amber-500/20 text-amber-200 text-xs max-w-[200px] p-3 z-[3000]">
                      <div className="flex flex-col gap-1 text-left">
                        <div className="font-bold flex items-center gap-1 uppercase tracking-widest text-[10px]">
                          <Pin size={12} className="text-amber-500" /> Premium Pin
                        </div>
                        <p className="opacity-70 leading-relaxed lowercase text-[11px]">
                          Boost your game to the top of the leaderboard for 3 full weeks.
                        </p>
                        <div className="mt-1 text-amber-400 font-xirod text-[8px]">Cost: 200 MOVE</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity p-1 pr-2">
                        <Info size={11} className="text-amber-200" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-white/10 text-[9px] text-white/60 lowercase z-[3000]">
                      Promoted games get 10x more visibility.
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Share Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const baseUrl = window.location.origin;
                  const gameData = games.find(g => g.id === gameId);
                  const shareCode = gameData?.join_code || gameName;
                  const shareUrl = `${baseUrl}/?code=${encodeURIComponent(shareCode)}`;

                  if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                    navigator.share({
                      title: `Join ${gameName} on Puffer Walks!`,
                      text: `I'm competing in "${gameName}" on Puffer Walks. Join me and let's see who walks the most!`,
                      url: shareUrl,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard!", {
                      description: "Share it with friends to invite them to this competition.",
                      duration: 3000,
                    });
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm"
                title="Share Competition"
              >
                <Share2 size={16} />
              </button>

              {status === 'upcoming' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-bold lowercase flex items-center gap-2 bg-blue-400/10 border-blue-400/20 text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                upcoming
              </div>
            )}
            {status === 'live' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-bold lowercase flex items-center gap-2 bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                live
              </div>
            )}
            {status === 'summarising' && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-amber-500/20 cursor-default transition-all shadow-sm">
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                summarising
              </div>
            )}
            {status === 'ended' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-bold lowercase flex items-center gap-2 bg-white/5 border-white/10 text-white/40">
                ended
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-4 py-4 border-t border-white/10">
            <div className="flex flex-col gap-1 text-center border-r border-white/10 px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">entry fee</span>
              <div className="flex items-center justify-center gap-1 md:gap-1.5 h-[24px]">
                <div className="text-white text-xs md:text-base font-bold tabular-nums leading-none">
                  {Math.floor(entryDeposit || 0)}
                </div>
                <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full" loading="lazy" decoding="async" alt="MOVE" />
                <span className="text-blue-400 text-[9px] font-bold">+10</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-center border-r border-white/10 px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">{numDays} days</span>
              <span className="text-white text-xs md:text-base font-normal tabular-nums leading-none flex items-center justify-center h-[24px]">
                {startMonth}/{startDay} <span className="text-white/20 text-[8px] mx-1"> - </span> {endMonth}/{endDay}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-center border-r border-white/10 px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">steps</span>
              <span className="text-white text-xs md:text-base font-normal flex items-center justify-center h-[24px]">{minDailySteps >= 1000 ? `${minDailySteps / 1000}k` : minDailySteps}</span>
            </div>
            <div className="flex flex-col gap-1 text-center px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">players</span>
              <span className="text-white text-xs md:text-base font-bold tabular-nums flex items-center justify-center h-[24px]">{participants.length}</span>
            </div>
          </div>

        </div>

        {/* Nested Table Card Area */}
        <div className="flex-1 min-h-[400px] bg-white/5">
          <div className="overflow-x-auto">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </div>
    </div>
  );
}

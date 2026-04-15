import { useEffect, useState, useMemo } from "react";

import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { useAccount } from "@razorlabs/razorkit";
import { useGame } from "../hooks/useGame";
import {
  Users,
  Trophy,
  Pin,
  Loader2
} from "lucide-react";
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

function ParticipantProfile({ address, fallbackName, isMe, isPodium, rank, isPinned }: {
  address: string,
  fallbackName: string,
  isMe: boolean,
  isPodium: boolean,
  rank: number,
  isPinned?: boolean
}) {
  const [profile, setProfile] = useState<{ username: string | null, profileImage: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const addr = address?.toLowerCase();
        if (!addr) return;
        const userSnap = await getDoc(doc(db, "users", addr));
        if (userSnap.exists()) {
          setProfile(userSnap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching live profile:", err);
      }
    };
    fetchProfile();
  }, [address]);

  const username = profile?.username || fallbackName;
  const pfp = profile?.profileImage;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-normal ${isMe ? "" : isPodium ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]}` : "bg-muted"
          }`}
      >
        {pfp ? (
          <img src={pfp} alt={username} className="w-full h-full object-cover" />
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
  const { pinUser } = useGame();
  const [isPinning, setIsPinning] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const myAddress = address?.toLowerCase();

  useEffect(() => {
    if (!gameId) return;
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
        <span className={`text-[12px] font-bold ${(row.original.walletAddress?.toLowerCase() === myAddress) ? 'text-blue-400' : 'text-foreground'}`}>
          {cell.getValue<number>()}
        </span>
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
            address={row.original.walletAddress}
            fallbackName={row.original.username || shortAddr(row.original.walletAddress)}
            isMe={row.original.walletAddress?.toLowerCase() === myAddress}
            isPodium={row.original.rank <= 3}
            rank={row.original.rank}
            isPinned={row.original.isPinned}
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
      return {
        hover: false,
        sx: {
          backgroundColor: isMe ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
          '&:hover': {
            backgroundColor: isMe ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
          },
          border: 'none !important',
          transition: 'none',
          color: 'var(--color-foreground)',
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
              {sponsorImageUrl ? (
                <img src={sponsorImageUrl} alt={sponsorName} className="w-full h-full object-contain grayscale opacity-60 invert" />
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
                {imageUrl ? (
                  <img src={imageUrl} alt={gameName} className="w-full h-full object-cover" />
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
            {myAddress && participants.some(p => {
              const isMe = p.walletAddress.toLowerCase() === myAddress;
              const hasActivePin = p.isPinned && p.pinnedUntil && p.pinnedUntil > Date.now();
              return isMe && !hasActivePin;
            }) && (
              <button 
                onClick={async () => {
                  if (isPinning) return;
                  try {
                    setIsPinning(true);
                    await pinUser(gameId);
                  } catch(e) {
                    alert("Failed to pin. Consult console.");
                  } finally {
                    setIsPinning(false);
                  }
                }}
                disabled={isPinning}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-bold tracking-tight transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ml-auto mr-1 disabled:opacity-50"
              >
                {isPinning ? <Loader2 size={12} className="animate-spin" /> : <Pin size={12} />}
                Pin Me (200 Move)
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-4 py-4 border-t border-white/10">
            <div className="flex flex-col gap-1 text-center border-r border-white/10 px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">entry fee</span>
              <div className="flex items-center justify-center gap-1 md:gap-1.5 h-[24px]">
                <div className="text-white text-xs md:text-base font-bold tabular-nums leading-none">
                  {Math.floor(entryDeposit || 0)}
                </div>
                <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full" alt="MOVE" />
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
              <span className="text-white text-xs md:text-base font-normal flex items-center justify-center h-[24px]">{(minDailySteps / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex flex-col gap-1 text-center px-1">
              <span className="text-[9px] md:text-[10px] text-white/40 lowercase whitespace-nowrap">players</span>
              <span className="text-white text-xs md:text-base font-bold tabular-nums flex items-center justify-center h-[24px]">{participants.length}</span>
            </div>
          </div>

        </div>

        {/* Nested Table Card Area */}
        <div className="flex-1 min-h-[400px] bg-white/5">
          <div className="overflow-x-auto scrollbar-hide">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </div>
    </div>
  );
}

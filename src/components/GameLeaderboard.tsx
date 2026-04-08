import { useEffect, useState, useMemo } from "react";

import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAccount } from "@razorlabs/razorkit";
import {
  Users,
  Trophy
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

function ParticipantProfile({ address, fallbackName, isMe, isPodium, rank }: {
  address: string,
  fallbackName: string,
  isMe: boolean,
  isPodium: boolean,
  rank: number
}) {
  const [profile, setProfile] = useState<{ username: string | null, profileImage: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", address.toLowerCase()));
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
        className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-normal ring-2 ${isMe ? "ring-blue-200" : isPodium ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]} ring-transparent` : "ring-gray-100 bg-gray-50"
          }`}
      >
        {pfp ? (
          <img src={pfp} alt={username} className="w-full h-full object-cover" />
        ) : (
          <span className={isPodium ? "text-white" : "text-gray-400"}>
            {username?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className={`text-xs font-normal truncate max-w-[120px] ${isMe ? "text-blue-600" : "text-gray-800"}`}>
          {username}
        </div>
      </div>
      {isMe && (
        <span className="ml-1 text-[8px] bg-blue-50 text-blue-600 font-normal px-1.5 py-0.5 rounded-full shrink-0 lowercase">
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const myAddress = address?.toLowerCase();

  useEffect(() => {
    if (!gameId) return;
    const ref = collection(db, "games", gameId, "participants");
    const unsub = onSnapshot(ref, {
      next: (snap) => {
        const data = snap.docs.map((d) => d.data() as Participant);
        setParticipants(data);
        setIsLoading(false);
      },
      error: () => setIsLoading(false)
    });
    return () => unsub();
  }, [gameId]);

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
      return { ...p, totalSteps, daysHitTarget, rank: 0 };
    })
    .sort((a, b) => b.totalSteps - a.totalSteps || b.daysHitTarget - a.daysHitTarget)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const shortAddr = (addr: string) =>
    addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "--";

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
          color: '#111827',
          fontSize: '11px',
        },
      },
      muiTableBodyCellProps: {
        sx: {
          paddingLeft: '24px',
          paddingRight: '4px',
          textAlign: 'left',
        },
      },
      Cell: ({ cell }) => (
        <span className={`text-[12px] font-bold ${cell.row.original.walletAddress.toLowerCase() === myAddress ? 'text-blue-500' : 'text-gray-900'}`}>
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
          color: '#111827',
        },
      },
      muiTableBodyCellProps: {
        sx: {
          paddingLeft: '0px',
        },
      },
      Cell: ({ row }) => (
        <ParticipantProfile
          address={row.original.walletAddress}
          fallbackName={row.original.username || shortAddr(row.original.walletAddress)}
          isMe={row.original.walletAddress.toLowerCase() === myAddress}
          isPodium={row.original.rank <= 3}
          rank={row.original.rank}
        />
      ),
    },
    ...dayColumns.map((d): MRT_ColumnDef<RankedParticipant> => ({
      id: `day${d}`,
      accessorFn: (row) => row.days ? row.days[`day${d}`] : undefined,
      header: `Day ${d}`,
      size: 90,
      Cell: ({ cell }: { cell: any }) => {
        const steps = cell.getValue() as number | null;
        const hitTarget = (steps || 0) >= minDailySteps;
        return (
          <span className={`text-[11px] tabular-nums font-normal ${hitTarget ? 'text-blue-500' : 'text-gray-300'}`}>
            {steps ? steps.toLocaleString() : "—"}
          </span>
        );
      },
    })),
  ], [dayColumns, minDailySteps, myAddress]);

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
    muiTableBodyRowProps: ({ row }) => ({
      hover: false,
      sx: {
        backgroundColor: row.original.walletAddress.toLowerCase() === myAddress ? 'rgba(239, 246, 255, 0.5)' : 'transparent',
        '&:hover': {
          backgroundColor: row.original.walletAddress.toLowerCase() === myAddress ? 'rgba(239, 246, 255, 0.5)' : 'transparent',
        },
        border: 'none',
        transition: 'none',
      },
    }),
    muiTableHeadCellProps: {
      sx: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'none',
        padding: '12px 12px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #f3f4f6',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '6px 12px',
        borderBottom: 'none',
        fontSize: '11px',
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: 'none',
      },
    },
    renderEmptyRowsFallback: () => (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Users size={32} className="text-gray-200" />
        <p className="text-[11px] text-gray-300 lowercase">no participants found</p>
      </div>
    ),
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-[11px] text-gray-400 lowercase italic">syncing competition data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* Sponsor Area (Separate Compact Minimalist Card) */}
      {!!sponsorName && (
        <div className="flex justify-center mb-0">
          <div className="flex items-center gap-3 py-4 px-6 rounded-3xl transition-all">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {sponsorImageUrl ? (
                <img src={sponsorImageUrl} alt={sponsorName} className="w-full h-full object-contain grayscale opacity-80" />
              ) : (
                <Trophy className="text-gray-300" size={20} />
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] font-normal lowercase tracking-wide mb-0.5">sponsored by</span>
              <h4 className="text-gray-900 text-sm md:text-md font-medium tracking-tight whitespace-nowrap lowercase">
                {sponsorName}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 flex flex-col w-full overflow-hidden relative shadow-sm">
        {/* Header Hero Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 ring-4 ring-gray-50">
                {imageUrl ? (
                  <img src={imageUrl} alt={gameName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500 font-normal text-xl uppercase">
                    {gameName?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl md:text-2xl font-medium text-gray-900 leading-tight mb-1">
                  {gameName}
                </h3>
              </div>
            </div>

            {status === 'upcoming' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-normal lowercase flex items-center gap-2 bg-blue-50 border-blue-100 text-blue-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                upcoming
              </div>
            )}
            {status === 'live' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-normal lowercase flex items-center gap-2 bg-green-50 border-green-100 text-green-600">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                live
              </div>
            )}
            {status === 'summarising' && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[11px] font-medium border border-amber-100/50 cursor-default transition-all shadow-sm">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Summarising
                </div>
                <span className="text-[8px] text-amber-500/60 mt-1 uppercase font-bold tracking-tighter">Finalizing steps...</span>
              </div>
            )}
            {status === 'ended' && (
              <div className="px-4 py-2 rounded-2xl border text-[10px] font-normal lowercase flex items-center gap-2 bg-gray-50 border-gray-200 text-gray-500">
                ended
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-4 py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1 text-center border-r border-gray-100 px-1">
              <span className="text-[9px] md:text-[10px] text-gray-400 lowercase whitespace-nowrap">entry fee</span>
              <div className="flex items-center justify-center gap-1 md:gap-1.5 h-[28px]">
                <div className="text-gray-900 text-sm md:text-lg font-medium tabular-nums leading-none">
                  {Math.floor(entryDeposit || 0)}
                </div>
                <img src="https://explorer.movementnetwork.xyz/logo.png" className="w-4 h-4 md:w-5 md:h-5 rounded-full" alt="MOVE" />
                <span className="text-blue-500 text-[10px] font-bold">+10</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-center border-r border-gray-100 px-1">
              <span className="text-[9px] md:text-[10px] text-gray-400 lowercase whitespace-nowrap">{numDays} days</span>
              <span className="text-gray-900 text-sm md:text-lg font-normal tabular-nums leading-none flex items-center justify-center h-[28px]">
                {startMonth}/{startDay} <span className="text-gray-300 text-[10px] mx-1"> - </span> {endMonth}/{endDay}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-center border-r border-gray-100 px-1">
              <span className="text-[9px] md:text-[10px] text-gray-400 lowercase whitespace-nowrap">steps</span>
              <span className="text-gray-900 text-sm md:text-lg font-normal flex items-center justify-center h-[28px]">{(minDailySteps / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex flex-col gap-1 text-center px-1">
              <span className="text-[9px] md:text-[10px] text-gray-400 lowercase whitespace-nowrap">players</span>
              <span className="text-gray-900 text-sm md:text-lg font-normal tabular-nums flex items-center justify-center h-[28px]">{participants.length}</span>
            </div>
          </div>

        </div>

        {/* Nested Table Card */}
        <div className="border-t border-gray-100 flex-1 min-h-[400px]">
          <div className="overflow-x-auto scrollbar-hide">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </div>
    </div>
  );
}

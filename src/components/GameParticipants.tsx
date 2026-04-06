import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { CheckCircle, Clock, Users } from "lucide-react";

interface Participant {
  walletAddress: string;
  username: string;
  profileImage: string | null;
  joinedAt: any;
  days: Record<string, number | null>;
}

interface GameParticipantsProps {
  gameId: string;
  numDays: number;
  gameName: string;
}

export function GameParticipants({ gameId, numDays, gameName }: GameParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "games", gameId, "participants");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(d => d.data() as Participant);
      setParticipants(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [gameId]);

  const dayColumns = Array.from({ length: numDays }, (_, i) => i + 1);

  const shortAddr = (addr: string) =>
    addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "--";

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center">
        <Users size={32} className="text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{gameName} — Participants</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {participants.length} joined
        </span>
      </div>

      <table className="w-full min-w-[600px] text-sm border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th className="text-left text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-3 py-2 w-48">
              Player
            </th>
            <th className="text-left text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-3 py-2">
              Wallet
            </th>
            {dayColumns.map(d => (
              <th
                key={d}
                className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2 py-2 w-16"
              >
                Day {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => {
            const completedDays = dayColumns.filter(
              d => p.days?.[`day${d}`] !== null && p.days?.[`day${d}`] !== undefined
            ).length;
            const allDone = completedDays === numDays;

            return (
              <tr
                key={p.walletAddress}
                className={`rounded-xl ${allDone ? 'bg-green-50' : 'bg-white'} border border-gray-100`}
              >
                {/* Player */}
                <td className="px-3 py-3 rounded-l-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 ring-1 ring-blue-200/50">
                      {p.profileImage ? (
                        <img src={p.profileImage} alt={p.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-400 text-xs font-bold">
                          {p.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-xs truncate max-w-[100px]">
                      {p.username}
                    </span>
                  </div>
                </td>

                {/* Wallet */}
                <td className="px-3 py-3">
                  <span className="font-mono text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    {shortAddr(p.walletAddress)}
                  </span>
                </td>

                {/* Days */}
                {dayColumns.map(d => {
                  const steps = p.days?.[`day${d}`];
                  return (
                    <td key={d} className="px-2 py-3 text-center">
                      {steps === null || steps === undefined ? (
                        <Clock size={13} className="text-gray-200 mx-auto" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <CheckCircle size={13} className="text-green-500" />
                          <span className="text-[9px] text-gray-400 font-medium">{steps.toLocaleString()}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

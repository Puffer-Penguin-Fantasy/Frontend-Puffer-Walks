import { Suspense, useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WalletPanel } from "./LazyPanels";
import { TrendingUp, Footprints } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

import blueBackground from "../assets/blue.jpg";

interface LeaderboardEntry {
  rank: number;
  address: string;
  steps: number;
  username?: string;
}

export function GlobalLeaderboard() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef, 
          orderBy("totalSteps", "desc"), 
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc, index) => {
          const userData = doc.data();
          return {
            rank: index + 1,
            address: doc.id,
            steps: userData.totalSteps || 0,
            username: userData.username
          };
        });
        
        setEntries(data);
      } catch (err) {
        console.error("Error fetching global leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatAddress = (addr: string) => {
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed pb-20"
      style={{ backgroundImage: `url(${blueBackground})` }}
    >
      <Header onOpenWallet={() => setIsWalletOpen(true)} />

      <main className="container mx-auto px-4 pt-24 max-w-5xl">

        <div className="bg-black/40 backdrop-blur-md rounded-[32px] border-2 border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-normal text-white tracking-tight">Major Leaderboard</h1>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-white/40 text-sm">loading rankings...</p>
            </div>
          ) : (
            <>
              {/* Top 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {entries.slice(0, 3).map((user, idx) => (
                  <div 
                    key={user.address}
                    className={`p-6 rounded-[24px] border transition-all ${
                      idx === 0 
                        ? "bg-blue-600/20 border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)] md:scale-105" 
                        : "bg-white/5 border-white/10"
                    } flex flex-col items-center text-center relative overflow-hidden`}
                  >
                    <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center font-bold text-base ${
                      idx === 0 ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]" :
                      idx === 1 ? "bg-slate-300 text-black" : "bg-orange-400 text-black"
                    }`}>
                      {user.rank}
                    </div>
                    
                    <div className="text-xs font-mono text-white/50 mb-1">{user.username || formatAddress(user.address)}</div>
                    <div className="flex items-center gap-1.5 text-xl font-bold text-white">
                      <Footprints size={18} className="text-blue-400" />
                      {user.steps.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* List Table */}
              <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-[11px] font-normal text-white/30 tracking-tight">Rank</th>
                        <th className="px-6 py-4 text-[11px] font-normal text-white/30 tracking-tight">Username</th>
                        <th className="px-6 py-4 text-[11px] font-normal text-white/30 tracking-tight text-right">Total steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((user) => (
                        <tr key={user.address} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <span className={`text-sm font-bold ${
                              user.rank <= 3 ? "text-blue-400" : "text-white/20"
                            }`}>
                              #{user.rank}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-mono text-white/70 group-hover:text-white transition-colors">
                            {user.username || user.address}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 text-base font-bold text-white">
                              <TrendingUp size={14} className="text-green-500/40" />
                              {user.steps.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <Suspense fallback={null}>
        <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      </Suspense>

      <Footer />
    </div>
  );
}

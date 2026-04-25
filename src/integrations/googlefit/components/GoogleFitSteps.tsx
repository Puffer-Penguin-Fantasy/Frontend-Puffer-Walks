import { useGoogleFit } from "../hooks/useGoogleFit";
import { Activity, RefreshCcw, TrendingUp } from "lucide-react";

export function GoogleFitSteps() {
    const { steps, isSyncing, fetchSteps, isConnected } = useGoogleFit();

    if (!isConnected) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Today's Steps Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl p-5 border border-[#303030] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-12 h-12 text-[#fcc61f]" />
                </div>

                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 tracking-widest">Google fit today</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">
                            {steps?.toLocaleString() ?? "0"}
                            <span className="text-[12px] text-slate-500 ml-2 font-medium tracking-normal">steps</span>
                        </h3>
                    </div>
                    <button
                        onClick={() => fetchSteps()}
                        disabled={isSyncing}
                        className={`p-2 rounded-lg bg-[#303030] border border-[#404040] text-slate-400 hover:text-[#fcc61f] transition-all ${isSyncing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                    <div className="flex items-center gap-1 text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        <span>Active</span>
                    </div>
                    <span className="text-slate-500">Live synchronization</span>
                </div>
            </div>
        </div>
    );
}

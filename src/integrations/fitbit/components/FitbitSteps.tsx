import { RefreshCw } from "lucide-react";
import { useFitbit } from "../hooks/useFitbit";

export function FitbitSteps() {
    const { steps, isSyncing, fetchSteps, isConnected } = useFitbit();

    if (!isConnected) return null;

    return (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#303030] p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-white tracking-[0.2em]">Live activity</h4>
                    <p className="text-[10px] text-white/40">Real-time tracking</p>
                </div>
                <button
                    onClick={() => fetchSteps()}
                    disabled={isSyncing}
                    className={`p-2 rounded-lg bg-[#252525] border border-[#333333] text-slate-400 hover:text-white transition-all ${isSyncing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tighter text-white">
                            {steps !== null ? steps.toLocaleString() : "0"}
                        </span>
                        <span className="text-[8px] font-bold text-[#fcc61f] uppercase">Daily</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Steps today</p>
                </div>
            </div>
        </div>
    );
}

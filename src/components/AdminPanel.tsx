import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Activity, Coins, Loader2 } from "lucide-react";
import { useGame } from "../hooks/useGame";

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
    const { 
        secondaryAdminAddress, 
        oracleAddress, 
        updateSecondaryAdmin, 
        updateOracleAddress 
    } = useGame();

    const [secondaryAdminInput, setSecondaryAdminInput] = React.useState("");
    const [oracleInput, setOracleInput] = React.useState("");
    const [isUpdatingAdmin, setIsUpdatingAdmin] = React.useState(false);
    const [isUpdatingOracle, setIsUpdatingOracle] = React.useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-md bg-background shadow-2xl flex flex-col h-full border-l border-border"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-xl">
                                    <ShieldCheck className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-lg text-foreground tracking-tight">Protocol settings</h2>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-12">
                            {/* Treasury Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <Coins className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-xs text-muted-foreground tracking-tight lowercase">Treasury management</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-2xl border border-border">
                                        <p className="text-[10px] text-muted-foreground mb-2 lowercase">Current treasury address</p>
                                        <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                                            {secondaryAdminAddress || "Not configured on-chain"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Enter new treasury address (0x...)"
                                            className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-sm outline-none focus:border-accent transition-all font-mono text-foreground"
                                            value={secondaryAdminInput}
                                            onChange={(e) => setSecondaryAdminInput(e.target.value)}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!secondaryAdminInput) return;
                                                setIsUpdatingAdmin(true);
                                                try {
                                                    await updateSecondaryAdmin(secondaryAdminInput);
                                                    setSecondaryAdminInput("");
                                                    alert("Treasury wallet set successfully!");
                                                } catch (err) {
                                                    alert("Protocol update failed.");
                                                } finally {
                                                    setIsUpdatingAdmin(false);
                                                }
                                            }}
                                            disabled={isUpdatingAdmin}
                                            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {isUpdatingAdmin && <Loader2 size={14} className="animate-spin" />}
                                            Update Treasury
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Oracle Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-xs text-muted-foreground tracking-tight lowercase">Oracle authority</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-2xl border border-border">
                                        <p className="text-[10px] text-muted-foreground mb-2 lowercase">Current oracle address</p>
                                        <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                                            {oracleAddress || "Not configured on-chain"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Enter new oracle address (0x...)"
                                            className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-sm outline-none focus:border-accent transition-all font-mono text-foreground"
                                            value={oracleInput}
                                            onChange={(e) => setOracleInput(e.target.value)}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!oracleInput) return;
                                                setIsUpdatingOracle(true);
                                                try {
                                                    await updateOracleAddress(oracleInput);
                                                    setOracleInput("");
                                                    alert("Oracle authority set successfully!");
                                                } catch (err) {
                                                    alert("Protocol update failed.");
                                                } finally {
                                                    setIsUpdatingOracle(false);
                                                }
                                            }}
                                            disabled={isUpdatingOracle}
                                            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {isUpdatingOracle && <Loader2 size={14} className="animate-spin" />}
                                            Update Oracle
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-muted/30">
                            <p className="text-[10px] text-muted-foreground text-center leading-relaxed lowercase">
                                Administrative actions are immutable and require on-chain confirmation. Ensure addresses are correct before updating.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

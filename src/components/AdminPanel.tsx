import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Coins, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useGame } from "../hooks/useGame";
import { useSound } from "../hooks/useSound";
import cancelBg from "../assets/gameframe/cancel.png";
import buttonBg from "../assets/gameframe/button.png";
import blueBg from "../assets/blue.jpg";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { playClick } = useSound();
  const {
    games,
    secondaryAdminAddress,
    oracleAddress,
    adminAddress,
    updateSecondaryAdmin,
    updateOracleAddress,
    claimAdminFees,
    claimPinFees,
    getPinTreasuryBalance,
    deleteGame,
    refresh,
  } = useGame();

  const [expandedKey, setExpandedKey] = React.useState<string | null>("fees");
  const [secondaryAdminInput, setSecondaryAdminInput] = React.useState("");
  const [oracleInput, setOracleInput] = React.useState("");
  const [isUpdatingAdmin, setIsUpdatingAdmin] = React.useState(false);
  const [isUpdatingOracle, setIsUpdatingOracle] = React.useState(false);
  const [claimingGameId, setClaimingGameId] = React.useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = React.useState<string | null>(null);
  const [isClaimingPin, setIsClaimingPin] = React.useState(false);
  const [pinBalance, setPinBalance] = React.useState<number>(0);
  const [pinWithdrawAmount, setPinWithdrawAmount] = React.useState<string>("");
  const [toast, setToast] = React.useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchPinBalance = React.useCallback(async () => {
    const bal = await getPinTreasuryBalance();
    setPinBalance(bal);
  }, [getPinTreasuryBalance]);

  React.useEffect(() => {
    if (isOpen) fetchPinBalance();
  }, [isOpen, fetchPinBalance]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const now = Math.floor(Date.now() / 1000);
  const endedGames = games.filter(g => parseInt(g.end_time) < now);
  const activeGames = games.filter(g => parseInt(g.end_time) >= now);

  const toggle = (key: string) => {
    playClick();
    setExpandedKey(expandedKey === key ? null : key);
  };

  const handleClaimFees = async (gameId: string) => {
    setClaimingGameId(gameId);
    try {
      await claimAdminFees(gameId);
      showToast("Admin fees claimed!");
    } catch (err: any) {
      showToast(err?.message?.includes("wait_period") ? "Game hasn't ended yet." : "Failed to claim fees.", "error");
    } finally {
      setClaimingGameId(null);
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Cancel "${gameName}"? Only works if there are 0 participants.`)) return;
    setDeletingGameId(gameId);
    try {
      await deleteGame(gameId);
      showToast("Game cancelled!");
    } catch {
      showToast("Cannot cancel — game may have participants.", "error");
    } finally {
      setDeletingGameId(null);
    }
  };

  const buttonStyle = {
    backgroundImage: `url(${buttonBg})`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };

  const sections = [
    { key: "fees", label: `Game Fees (${endedGames.length} ended)` },
    { key: "pins", label: "Premium Pin Treasury" },
    { key: "games", label: `Manage Games (${activeGames.length} active)` },
    { key: "treasury", label: "Recovery Wallet" },
    { key: "oracle", label: "Oracle Control" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { playClick(); onClose(); }}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, duration: 0.3 }}
            style={{ backgroundImage: `url(${blueBg})` }}
            className="relative w-full max-w-md bg-cover bg-center shadow-2xl flex flex-col h-full overflow-hidden border-l border-white/10"
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0" />

            <div className="relative z-10 flex flex-col h-full flex-1">
              {/* X button */}
              <div className="absolute top-7 left-8 z-20">
                <button
                  onClick={() => { playClick(); onClose(); }}
                  className="w-10 h-10 flex items-center justify-center text-black font-xirod text-xs hover:opacity-80 transition-opacity"
                  style={{
                    backgroundImage: `url(${cancelBg})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  X
                </button>
              </div>

              {/* Title */}
              <div className="absolute top-7 right-8 z-10">
                <span className="text-[12px] font-xirod text-white/80">Protocol Settings</span>
              </div>

              {/* Toast */}
              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`absolute top-20 left-8 right-8 z-30 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-medium ${
                      toast.type === "success"
                        ? "bg-green-500/20 border border-green-500/30 text-green-300"
                        : "bg-red-500/20 border border-red-500/30 text-red-300"
                    }`}
                  >
                    {toast.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {toast.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sections */}
              <div className="p-8 overflow-y-auto flex-1 space-y-2 no-scrollbar pt-24">

                {sections.map(({ key, label }) => (
                  <div key={key} className="border-b border-white/10 pb-2">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between py-6 group"
                    >
                      <span className={`text-[12px] font-xirod transition-all duration-300 ${
                        expandedKey === key ? "text-white border-b-2 border-white" : "text-white/80 hover:text-white"
                      }`}>
                        {label}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedKey === key ? 180 : 0 }}
                        className="text-white/60 group-hover:text-white transition-colors"
                      >
                        <ChevronDown size={22} strokeWidth={1} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedKey === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-6 space-y-3">

                            {/* Fee Collection */}
                            {key === "fees" && (
                              <>
                                {endedGames.length === 0 ? (
                                  <p className="text-xs text-white/30 py-2">No ended games to collect from.</p>
                                ) : (
                                  endedGames.map(game => (
                                    <div key={game.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                                      {game.image_url && (
                                        <img src={game.image_url} alt={game.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-xirod text-white truncate">{game.name}</div>
                                        <div className="text-[10px] text-white/40">{game.participants_count} players</div>
                                      </div>
                                      <button
                                        onClick={() => { playClick(); handleClaimFees(game.id); }}
                                        disabled={claimingGameId === game.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-xirod rounded-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                      >
                                        {claimingGameId === game.id ? <Loader2 size={11} className="animate-spin" /> : <Coins size={11} />}
                                        Claim
                                      </button>
                                    </div>
                                  ))
                                )}
                              </>
                            )}

                            {/* Premium Pins */}
                            {key === "pins" && (
                              <div className="space-y-4">
                                <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-xirod text-amber-400/60 uppercase tracking-widest mb-1">Treasury Balance</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl font-bold text-amber-400 tabular-nums">{pinBalance.toLocaleString()}</span>
                                      <span className="text-[10px] font-xirod text-amber-400">MOVE</span>
                                    </div>
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
                                    <Coins size={20} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      placeholder="Amount to withdraw"
                                      className="w-full px-4 h-12 bg-black/30 border border-white/10 rounded-xl text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-amber-400/30 transition-all pr-16"
                                      value={pinWithdrawAmount}
                                      onChange={e => setPinWithdrawAmount(e.target.value)}
                                    />
                                    <button 
                                      onClick={() => setPinWithdrawAmount(pinBalance.toString())}
                                      className="absolute right-2 top-2 px-2.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[9px] font-xirod rounded-lg transition-all"
                                    >
                                      MAX
                                    </button>
                                  </div>
                                  
                                  <button
                                    onClick={async () => {
                                      const amt = parseFloat(pinWithdrawAmount);
                                      if (isNaN(amt) || amt <= 0) return showToast("Enter valid amount", "error");
                                      playClick();
                                      setIsClaimingPin(true);
                                      try {
                                        await claimPinFees(amt);
                                        showToast(`Successfully withdrawn ${amt} MOVE`);
                                        setPinWithdrawAmount("");
                                        fetchPinBalance();
                                      } catch { showToast("Withdrawal failed", "error"); }
                                      finally { setIsClaimingPin(false); }
                                    }}
                                    disabled={isClaimingPin || !pinWithdrawAmount}
                                    style={{ ...buttonStyle, filter: "hue-rotate(320deg) saturate(1.5)" }}
                                    className="w-full h-14 text-black font-xirod text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                  >
                                    {isClaimingPin ? <Loader2 size={12} className="animate-spin" /> : <Coins size={12} />}
                                    Withdraw MOVE
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Game Management */}
                            {key === "games" && (
                              <>
                                {activeGames.length === 0 ? (
                                  <p className="text-xs text-white/30 py-2">No active games.</p>
                                ) : (
                                  activeGames.map(game => {
                                    const hasStarted = parseInt(game.start_time) < now;
                                    const hasParticipants = (game.participants_count || 0) > 0;
                                    return (
                                      <div key={game.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                                        {game.image_url && (
                                          <img src={game.image_url} alt={game.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-xirod text-white truncate">{game.name}</div>
                                          <div className="text-[10px] text-white/40">
                                            {hasStarted ? "In progress" : "Upcoming"} · {game.participants_count} players
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => { playClick(); handleDeleteGame(game.id, game.name); }}
                                          disabled={deletingGameId === game.id || hasParticipants || hasStarted}
                                          title={hasParticipants ? "Has participants" : hasStarted ? "Already started" : "Cancel game"}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[11px] font-xirod rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                        >
                                          {deletingGameId === game.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                          Cancel
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                                <button onClick={() => { playClick(); refresh(); }} className="text-[10px] font-xirod text-white/30 hover:text-white/60 transition-colors pt-1">
                                  ↺ Refresh games
                                </button>
                              </>
                            )}

                            {/* Treasury */}
                            {key === "treasury" && (
                              <>
                                <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                                  <p className="text-[10px] text-white/30 mb-1 font-xirod">Current</p>
                                  <p className="text-[11px] font-mono text-white/60 break-all leading-relaxed">
                                    {secondaryAdminAddress || "—"}
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  placeholder="New treasury address (0x...)"
                                  className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                                  value={secondaryAdminInput}
                                  onChange={e => setSecondaryAdminInput(e.target.value)}
                                />
                                <button
                                  onClick={async () => {
                                    setIsUpdatingAdmin(true);
                                    try {
                                      await updateSecondaryAdmin(secondaryAdminInput);
                                      setSecondaryAdminInput("");
                                      showToast("Treasury wallet updated!");
                                    } catch { showToast("Update failed.", "error"); }
                                    finally { setIsUpdatingAdmin(false); }
                                  }}
                                  disabled={isUpdatingAdmin || !secondaryAdminInput}
                                  style={buttonStyle}
                                  className="w-full h-12 text-black font-xirod text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                  {isUpdatingAdmin && <Loader2 size={12} className="animate-spin" />}
                                  Update Treasury
                                </button>
                              </>
                            )}

                            {/* Oracle */}
                            {key === "oracle" && (
                              <>
                                <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                                  <p className="text-[10px] text-white/30 mb-1 font-xirod">Current</p>
                                  <p className="text-[11px] font-mono text-white/60 break-all leading-relaxed">
                                    {oracleAddress || "—"}
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  placeholder="New oracle address (0x...)"
                                  className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                                  value={oracleInput}
                                  onChange={e => setOracleInput(e.target.value)}
                                />
                                <button
                                  onClick={async () => {
                                    setIsUpdatingOracle(true);
                                    try {
                                      await updateOracleAddress(oracleInput);
                                      setOracleInput("");
                                      showToast("Oracle authority updated!");
                                    } catch { showToast("Update failed.", "error"); }
                                    finally { setIsUpdatingOracle(false); }
                                  }}
                                  disabled={isUpdatingOracle || !oracleInput}
                                  style={buttonStyle}
                                  className="w-full h-12 text-black font-xirod text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                  {isUpdatingOracle && <Loader2 size={12} className="animate-spin" />}
                                  Update Oracle
                                </button>
                              </>
                            )}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Admin address info */}
                <div className="pt-4">
                  <p className="text-[10px] font-xirod text-white/20 mb-1">Primary Admin</p>
                  <p className="text-[10px] font-mono text-white/30 break-all">{adminAddress || "—"}</p>
                </div>
              </div>

              {/* Bottom note */}
              <div className="p-8 pt-0">
                <p className="text-[9px] font-xirod text-white/20 text-center leading-relaxed tracking-wider">
                  All admin actions are on-chain and irreversible.<br />Verify addresses before submitting.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

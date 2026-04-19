import React, { useState, useRef } from "react";
import { X, Calendar, Trophy, Footprints, Lock, Globe, Loader2, ShieldCheck, Upload, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
// useAccount removed to fix build error

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: any) => Promise<any>;
}

export function CreateGameModal({ isOpen, onClose, onSubmit }: CreateGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    deposit: "10",
    min_steps: "3000",
    start_date: "",
    end_date: "",
    duration_days: 0,
    is_public: true,
    code: "",
    sponsor_name: "",
    sponsor_amount: "0",
  });

  const uploadToPinata = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const token = import.meta.env.VITE_PINATA_JWT;
    if (!token) throw new Error("Pinata JWT not found.");
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error(`Pinata error: ${res.status}`);
    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSponsorLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSponsorLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSponsorLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const computeDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff + 1);
  };

  const deposit = parseFloat(formData.deposit) || 0;
  const sponsorAmt = parseFloat(formData.sponsor_amount) || 0;
  const protocolFee = 10; // 10 MOVE game fee
  const sponsorProtocolCut = sponsorAmt > 0 ? +(sponsorAmt * 0.2).toFixed(2) : 0;
  const totalCost = deposit + protocolFee + sponsorAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date) return alert("Please select a start date.");
    if (formData.duration_days <= 0) return alert("End date must be after start date.");
    setIsSubmitting(true);
    try {
      let image_url = "";
      let sponsor_image_url = "";
      if (imageFile) image_url = await uploadToPinata(imageFile);
      if (sponsorLogoFile) sponsor_image_url = await uploadToPinata(sponsorLogoFile);

      const [year, month, day] = formData.start_date.split("-").map(Number);
      const startUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
      const start_time = Math.floor(startUtc / 1000);
      const no_of_days = formData.duration_days;

      const result = await onSubmit({
        name: formData.name,
        image_url,
        deposit_amount: deposit,
        min_daily_steps: parseInt(formData.min_steps),
        start_time,
        no_of_days,
        is_public: formData.is_public,
        join_code: formData.code,
        sponsor_name: formData.sponsor_name,
        sponsor_amount: sponsorAmt,
        sponsor_image_url,
        required_nft: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      // Saving metadata to Firestore for instant discovery
      const gameId = result?.game_id;
      if (gameId) {
        await setDoc(doc(db, "games", String(gameId)), {
          id: String(gameId),
          name: formData.name,
          image_url,
          startTime: start_time,
          endTime: start_time + (no_of_days * 86400),
          numDays: no_of_days,
          minSteps: parseInt(formData.min_steps),
          deposit: deposit,
          isPublic: formData.is_public,
          joinCode: formData.code, // Storing code for easier discovery as requested
          sponsorName: formData.sponsor_name,
          sponsorImageUrl: sponsor_image_url,
          sponsorAmount: sponsorAmt,
          createdAt: Date.now(),
        }, { merge: true });
      }

      // Reset form
      setFormData({ name: "", deposit: "10", min_steps: "3000", start_date: "", end_date: "", duration_days: 0, is_public: true, code: "", sponsor_name: "", sponsor_amount: "0" });
      setImageFile(null); setImagePreview(null);
      setSponsorLogoFile(null); setSponsorLogoPreview(null);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to launch competition. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#0d1117] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Launch Competition</h2>
                <p className="text-white/40 text-xs mt-0.5">Configure a new on-chain walking battle</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X size={16} className="text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 no-scrollbar">
              <div className="p-6 space-y-6">

                {/* Banner + Name row */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block tracking-widest">Competition Name</label>
                    <div className="relative">
                      <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                      <input
                        required type="text" placeholder="e.g. Arctic Sprint 2025"
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block uppercase tracking-widest">Banner</label>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 flex items-center justify-center cursor-pointer overflow-hidden transition-all"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={16} className="text-white/30" />
                      )}
                    </div>
                    <input ref={bannerInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleBannerChange} />
                  </div>
                </div>

                {/* Deposit + Steps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block tracking-widest">Entry Deposit (MOVE)</label>
                    <div className="relative">
                      <img src="https://explorer.movementnetwork.xyz/logo.png" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" alt="MOVE" />
                      <input
                        required type="number" step="1" min="1"
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                        value={formData.deposit}
                        onChange={e => setFormData({ ...formData, deposit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block uppercase tracking-widest">Min Daily Steps</label>
                    <div className="relative">
                      <Footprints className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                      <input
                        required type="number" step="500"
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                        value={formData.min_steps}
                        onChange={e => setFormData({ ...formData, min_steps: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block uppercase tracking-widest">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" size={15} />
                      <input
                        required type="date"
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]"
                        value={formData.start_date}
                        onChange={e => {
                          const start = e.target.value;
                          const days = computeDays(start, formData.end_date);
                          setFormData({ ...formData, start_date: start, duration_days: days });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block uppercase tracking-widest">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" size={15} />
                      <input
                        required type="date" min={formData.start_date}
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]"
                        value={formData.end_date}
                        onChange={e => {
                          const end = e.target.value;
                          const days = computeDays(formData.start_date, end);
                          setFormData({ ...formData, end_date: end, duration_days: days });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Duration pill */}
                {formData.duration_days > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Footprints size={14} className="text-blue-400 shrink-0" />
                    <span className="text-sm text-blue-300 font-medium">{formData.duration_days} day competition</span>
                    <span className="ml-auto text-xs text-blue-400/60">Midnight UTC → Midnight UTC</span>
                  </div>
                )}

                {/* Visibility */}
                <div>
                  <label className="text-[11px] font-medium text-white/40 mb-3 block uppercase tracking-widest">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true, icon: <Globe size={14} />, label: "Public", desc: "Anyone can join" },
                      { val: false, icon: <Lock size={14} />, label: "Private", desc: "Invite code required" },
                    ].map(opt => (
                      <button
                        key={String(opt.val)} type="button"
                        onClick={() => setFormData({ ...formData, is_public: opt.val, code: "" })}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          formData.is_public === opt.val
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8"
                        }`}
                      >
                        {opt.icon}
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] opacity-60">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {!formData.is_public && (
                  <div>
                    <label className="text-[11px] font-medium text-white/40 mb-2 block uppercase tracking-widest">Join Code</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                      <input
                        required={!formData.is_public} type="text" placeholder="Secret code"
                        className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Sponsor Section */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={15} className="text-amber-400/60" />
                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Sponsorship (optional)</span>
                    <div className="ml-auto flex items-center gap-1 text-[10px] text-amber-400/60">
                      <Info size={11} />
                      20% protocol fee
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-white/30 mb-1.5 block">Sponsor Name</label>
                      <input
                        type="text" placeholder="e.g. Movement Labs"
                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/40 transition-all"
                        value={formData.sponsor_name}
                        onChange={e => setFormData({ ...formData, sponsor_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/30 mb-1.5 block">Sponsor Logo</label>
                      <div
                        onClick={() => sponsorLogoInputRef.current?.click()}
                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 cursor-pointer hover:border-amber-500/30 transition-all"
                      >
                        {sponsorLogoPreview ? (
                          <img src={sponsorLogoPreview} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <Upload size={14} className="text-white/30" />
                        )}
                        <span className="text-xs text-white/30">{sponsorLogoFile?.name || "Upload logo"}</span>
                      </div>
                      <input ref={sponsorLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleSponsorLogoChange} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-white/30 mb-1.5 block">Sponsor Deposit (MOVE)</label>
                      <div className="relative">
                        <img src="https://explorer.movementnetwork.xyz/logo.png" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" alt="MOVE" />
                        <input
                          type="number" step="1" min="0" placeholder="0"
                          className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-amber-500/40 transition-all"
                          value={formData.sponsor_amount}
                          onChange={e => setFormData({ ...formData, sponsor_amount: e.target.value })}
                        />
                      </div>
                    </div>
                    {sponsorAmt > 0 && (
                      <div className="col-span-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                          <div className="text-amber-400/50 text-[10px] mb-0.5">Protocol cut (20%)</div>
                          <div className="text-amber-400 font-semibold">{sponsorProtocolCut} MOVE</div>
                        </div>
                        <div className="p-2.5 bg-green-500/5 border border-green-500/15 rounded-lg">
                          <div className="text-green-400/50 text-[10px] mb-0.5">To prize pool (80%)</div>
                          <div className="text-green-400 font-semibold">{+(sponsorAmt * 0.8).toFixed(2)} MOVE</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="p-4 bg-white/3 border border-white/8 rounded-xl space-y-2">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Cost Breakdown</div>
                  {[
                    { label: "Entry deposit (returned if game completes)", value: `${deposit} MOVE` },
                    { label: "Protocol game fee (non-refundable)", value: `${protocolFee} MOVE` },
                    ...(sponsorAmt > 0 ? [{ label: "Sponsor deposit", value: `${sponsorAmt} MOVE` }] : []),
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-xs">
                      <span className="text-white/40">{item.label}</span>
                      <span className="text-white/80 font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-semibold">
                    <span className="text-white/60">Total</span>
                    <span className="text-white">{totalCost} MOVE</span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="px-6 pb-6 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Launching…</> : "🚀 Launch Competition"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

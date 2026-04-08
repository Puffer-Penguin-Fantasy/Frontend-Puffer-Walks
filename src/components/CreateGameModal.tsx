import React, { useState } from "react";
import { X, Calendar, Trophy, Coins, Footprints, Image as ImageIcon, Lock, Globe, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: any) => Promise<any>;
}

export function CreateGameModal({ isOpen, onClose, onSubmit }: CreateGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    deposit: "1.0",
    min_steps: "5000",
    start_date: "",
    end_date: "",
    duration_days: "7",
    is_public: true,
    code: "",
    sponsor_name: "",
    sponsor_amount: "0.0",
    sponsor_image_url: "",
  });

  const uploadToPinata = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = import.meta.env.VITE_PINATA_JWT;
      if (!token) throw new Error("Pinata JWT not found.");
      
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
      });
      if (!res.ok) throw new Error(`Pinata error: ${res.status}`);
      const data = await res.json();
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error("Failed to upload to Pinata:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let image_url = "";
      let sponsor_image_url = "";
      
      if (imageFile) {
        image_url = await uploadToPinata(imageFile);
      }
      if (sponsorLogoFile) {
        sponsor_image_url = await uploadToPinata(sponsorLogoFile);
      }


      // Calculate start time as Midnight UTC of the selected date
      // We use the date string "YYYY-MM-DD" and create a UTC date at 00:00:00
      const [year, month, day] = formData.start_date.split("-").map(Number);
      const startUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
      const start = Math.floor(startUtc / 1000);
      
      // Calculate end time based on start + (days * 86400)
      // This ensures the competition ends exactly at Midnight UTC on the day after the last day
      const durationSeconds = parseInt(formData.duration_days) * 86400;
      const end = start + durationSeconds;

      await onSubmit({
        ...formData,
        image_url,
        sponsor_image_url,
        deposit: parseFloat(formData.deposit),
        min_steps: parseInt(formData.min_steps),
        sponsor_amount: parseFloat(formData.sponsor_amount),
        start: start,
        end: end,
        no_of_days: formData.duration_days,
      });
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-none overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h2 className="text-xl font-normal text-gray-800 lowercase">launch competition</h2>
                <p className="text-gray-400 text-sm font-normal lowercase">configure a new on-chain walking battle.</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">competition name</label>
                  <div className="relative">
                    <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                    <input 
                      required
                      type="text"
                      placeholder="e.g. arctic sprint 2024"
                      className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">banner image</label>
                  <div className="relative flex items-center">
                    <ImageIcon className="absolute left-4 text-gray-400/60 pointer-events-none" size={16} />
                    <input 
                      type="file"
                      accept="image/*,video/*"
                      className="w-full h-11 pl-11 py-2 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-normal file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all cursor-pointer"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">entry deposit (move)</label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                    <input 
                      required
                      type="number"
                      step="0.1"
                      className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                      value={formData.deposit}
                      onChange={e => setFormData({...formData, deposit: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">min daily steps</label>
                  <div className="relative">
                    <Footprints className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                    <input 
                      required
                      type="number"
                      className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                      value={formData.min_steps}
                      onChange={e => setFormData({...formData, min_steps: e.target.value})}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">start date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                    <input 
                      required
                      type="date"
                      className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                      value={formData.start_date}
                      onChange={e => {
                        const start = e.target.value;
                        if (start && formData.end_date) {
                          const s = new Date(start);
                          const e_date = new Date(formData.end_date);
                          const diff = Math.ceil((e_date.getTime() - s.getTime()) / (1000 * 3600 * 24));
                          setFormData({...formData, start_date: start, duration_days: Math.max(0, diff).toString()});
                        } else {
                          setFormData({...formData, start_date: start});
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">end date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                    <input 
                      required
                      type="date"
                      min={formData.start_date}
                      className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                      value={formData.end_date}
                      onChange={e => {
                        const end = e.target.value;
                        if (formData.start_date && end) {
                          const s = new Date(formData.start_date);
                          const e_date = new Date(end);
                          const diff = Math.ceil((e_date.getTime() - s.getTime()) / (1000 * 3600 * 24));
                          setFormData({...formData, end_date: end, duration_days: diff.toString()});
                        } else {
                          setFormData({...formData, end_date: end});
                        }
                      }}
                    />
                  </div>
                </div>

                {formData.start_date && (
                  <div className="col-span-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group transition-all hover:bg-blue-50/30 hover:border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                        <Footprints size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 lowercase font-normal">competition duration</p>
                        <p className="text-sm text-gray-900 font-medium lowercase">
                          {formData.duration_days || "—"} days
                        </p>
                      </div>
                    </div>
                    {formData.end_date && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 lowercase font-normal">time window (utc)</p>
                        <p className="text-[10px] text-blue-600 font-medium">12:00 AM — 12:00 AM</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-normal text-gray-400 mb-2 block ml-1 lowercase">visibility</label>
                  <div className="flex gap-4 items-center h-11">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="visibility" 
                        checked={formData.is_public === true}
                        onChange={() => setFormData({...formData, is_public: true, code: ""})}
                        className="w-4 h-4 text-blue-600 border-gray-200 focus:ring-blue-200 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-blue-600 transition-colors lowercase">
                        <Globe size={14} /> public
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="visibility" 
                        checked={formData.is_public === false}
                        onChange={() => setFormData({...formData, is_public: false})}
                        className="w-4 h-4 text-blue-600 border-gray-200 focus:ring-blue-200 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-blue-600 transition-colors lowercase">
                        <Lock size={14} /> private
                      </div>
                    </label>
                  </div>
                </div>

                {!formData.is_public && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">join code</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                      <input
                        required={!formData.is_public}
                        type="text"
                        placeholder="secret code"
                        className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 transition-all text-xs text-gray-800"
                        value={formData.code}
                        onChange={e => setFormData({...formData, code: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="col-span-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-blue-600/60" />
                    <h4 className="text-[11px] font-normal text-gray-400 lowercase">initial protocol sponsor (optional)</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">sponsor name</label>
                      <input 
                        type="text"
                        placeholder="e.g. movement labs"
                        className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 text-xs text-gray-800"
                        value={formData.sponsor_name}
                        onChange={e => setFormData({...formData, sponsor_name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">sponsor logo</label>
                      <div className="relative flex items-center">
                        <ImageIcon className="absolute left-4 text-gray-400/60 pointer-events-none" size={16} />
                        <input 
                          type="file"
                          accept="image/*"
                          className="w-full h-11 pl-11 py-2 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-normal file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all cursor-pointer"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setSponsorLogoFile(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[11px] font-normal text-gray-400 mb-1.5 block ml-1 lowercase">sponsor deposit (move)</label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/60" size={16} />
                        <input 
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-200 text-xs text-gray-800"
                          value={formData.sponsor_amount}
                          onChange={e => setFormData({...formData, sponsor_amount: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-normal text-sm hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSubmitting ? "launching..." : "launch competition"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

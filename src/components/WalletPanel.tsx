"use client";

import { useEffect, useState } from "react";
import { LogOut, ChevronDown, Camera, Check, Loader2 } from "lucide-react";
import { useAccount, useWallet } from "@razorlabs/razorkit";
import { FitbitConnector } from "../integrations/fitbit/components/FitbitConnector";
import { useArcticPenguin } from "../hooks/useArcticPenguin";
import { useProfile } from "../hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { MODULE_ADDRESS } from "../GameOnchain/movement_service/constants";


interface WalletPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalletPanel({ isOpen, onClose }: WalletPanelProps) {
    const { address: rawAddress } = useAccount();
    const { disconnect, signAndSubmitTransaction } = useWallet();
    const [expandedKey, setExpandedKey] = useState<string | null>("profile");
    
    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const address = rawAddress?.toLowerCase();
    console.log("WalletPanel: Normalized address:", address);
    const { 
        username: initialUsername, 
        profileImage: initialImage, 
        hasFirebaseProfile, 
        hasOnChainProfile, 
        isLoading: profileLoading,
        refresh: refreshProfile
    } = useProfile(address);

    const [profileName, setProfileName] = useState("Puffer User");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isSavingOnChain, setIsSavingOnChain] = useState(false);

    const { data: arcticData, isLoading: arcticLoading } = useArcticPenguin(address);
    const isLoading = profileLoading || arcticLoading;

    const shortAddress = address?.slice(0, 6) + '...' + address?.slice(-4);
    const addressPrefix = "0x";

    // Sync state with hook data
    useEffect(() => {
        if (!isEditing && !isLoading) {
            console.log("WalletPanel: Syncing state with hook data:", { initialUsername, initialImage });
            if (initialUsername) setProfileName(initialUsername);
            if (initialImage) setProfileImage(initialImage);
        }
    }, [initialUsername, initialImage, isEditing, isLoading]);

    const handleLogout = () => {
        disconnect();
        onClose();
    };

    const handlePfpClick = () => {
        if (!isEditing) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setProfileImage(reader.result as string);
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const uploadToPinata = async (base64Data: string) => {
        try {
            console.log("Preparing file for Pinata...");
            const base64Parts = base64Data.split(',');
            const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const byteString = atob(base64Parts[1]);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }
            
            const file = new File([arrayBuffer], `pfp-${address}.png`, { type: mimeType });
            const formData = new FormData();
            formData.append("file", file);

            const token = import.meta.env.VITE_PINATA_JWT;
            if (!token) throw new Error("Pinata JWT not found. Check .env!");

            console.log("Calling Pinata API...");
            
            const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!pinataResponse.ok) {
                const detailedError = await pinataResponse.text();
                throw new Error(`Pinata error: ${pinataResponse.status} - ${detailedError}`);
            }
            
            const resData = await pinataResponse.json();
            return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
        } catch (error: any) {
            console.error("Failed to upload to Pinata:", error);
            throw error;
        }
    };

    const saveChanges = async () => {
        if (!address) return;
        setIsSaving(true);
        try {
            let finalImageUrl = profileImage;
            
            if (profileImage && profileImage.startsWith('data:image')) {
                finalImageUrl = await uploadToPinata(profileImage);
            }

            // Always use lowercase address for consistency in Firestore
            const userRef = doc(db, "users", address.toLowerCase());
            await setDoc(userRef, {
                username: profileName,
                profileImage: finalImageUrl,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            console.log("Profile saved successfully to Firebase!");
            await refreshProfile();
            setIsEditing(false);
        } catch (err: any) {
            console.error("Error saving profile to Firestore:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const saveOnChain = async () => {
        if (!rawAddress || !profileName) return;
        setIsSavingOnChain(true);
        try {
            await signAndSubmitTransaction({
                payload: {
                    function: `${MODULE_ADDRESS}::profile::create_profile`,
                    functionArguments: [profileName, profileImage || ""],
                }
            });
            console.log("Profile saved on-chain!");
            await refreshProfile();
        } catch (err) {
            console.error("Error saving on-chain profile:", err);
        } finally {
            setIsSavingOnChain(false);
        }
    };

    const toggleEdit = () => {
        if (!arcticData.hasNFT && !isEditing) return;
        if (isEditing) {
            saveChanges();
        } else {
            setIsEditing(true);
            setExpandedKey("profile");
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, duration: 0.3 }}
                        className="relative w-full max-w-md bg-[#f8f9fa] shadow-2xl flex flex-col h-full overflow-hidden border-l border-gray-200"
                    >
                        <div className="absolute top-7 right-8 z-10 flex flex-col items-end gap-2">
                            <button 
                                onClick={toggleEdit}
                                disabled={isSaving || isLoading || (!arcticData.hasNFT && !isEditing)}
                                className={`text-[11px] font-bold transition-all px-4 py-1.5 rounded-full border flex items-center gap-2 ${
                                    isEditing 
                                        ? "bg-black text-white" 
                                        : !arcticData.hasNFT 
                                            ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed" 
                                            : "bg-white border-gray-200 text-blue-600 hover:border-blue-100 hover:bg-blue-50/50"
                                }`}
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                                {isEditing ? "Save Changes" : arcticData.hasNFT ? "Edit Account" : "NFT Holder Only"}
                            </button>

                            {hasFirebaseProfile && !hasOnChainProfile && !isEditing && (
                                <button 
                                    onClick={saveOnChain}
                                    disabled={isSavingOnChain || isLoading}
                                    className="text-[10px] font-bold bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    {isSavingOnChain ? <Loader2 size={10} className="animate-spin" /> : null}
                                    Save Profile On-chain
                                </button>
                            )}
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 font-roboto space-y-2">
                            <div className="border-b border-gray-200 pb-2">
                                <button 
                                    onClick={() => setExpandedKey(expandedKey === "profile" ? null : "profile")}
                                    className="w-full flex items-center justify-between py-6 group"
                                >
                                    <span className={`text-[17px] font-medium transition-all duration-300 ${expandedKey === "profile" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-900 hover:text-gray-600"}`}>
                                        Wallet Profile
                                    </span>
                                    <motion.div
                                        animate={{ rotate: expandedKey === "profile" ? 180 : 0 }}
                                        className="text-gray-400 group-hover:text-gray-900 transition-colors"
                                    >
                                        <ChevronDown size={22} strokeWidth={1} />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {expandedKey === "profile" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden pb-8"
                                        >
                                            <div className="flex flex-col items-center space-y-6 pt-4 text-center">
                                                <div 
                                                    className={`relative group ${isEditing ? "cursor-pointer" : ""}`}
                                                    onClick={handlePfpClick}
                                                >
                                                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-[#f8f9fa] shadow-md overflow-hidden relative">
                                                        {isLoading ? (
                                                            <Loader2 size={32} className="animate-spin opacity-40" />
                                                        ) : profileImage ? (
                                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-3xl font-black tracking-tighter opacity-80">{addressPrefix}</span>
                                                        )}
                                                        
                                                        {isEditing && !isLoading && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Camera size={24} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-4 w-full flex flex-col items-center">
                                                    {isEditing ? (
                                                        <div className="relative w-full max-w-[240px] pb-4">
                                                            <input 
                                                                type="text"
                                                                value={profileName}
                                                                onChange={(e) => setProfileName(e.target.value)}
                                                                className="w-full bg-transparent border-b-2 border-blue-600 text-center font-bold text-xl text-gray-900 outline-none pb-2 placeholder:text-gray-300"
                                                                autoFocus
                                                                placeholder="Choose a name"
                                                            />
                                                            <div className="absolute bottom-0 left-0 right-0 text-[10px] text-blue-600 font-bold tracking-tight">Enter Username</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xl font-bold text-gray-900 leading-tight">
                                                            {isLoading ? "Loading..." : profileName}
                                                        </div>
                                                    )}
                                                    <div className="text-[11px] font-mono text-gray-400 opacity-60 px-4 py-1 bg-gray-50 rounded-full border border-gray-200/50">
                                                        {shortAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="border-b border-gray-200/60">
                                <button 
                                    onClick={() => setExpandedKey(expandedKey === "nft" ? null : "nft")}
                                    className="w-full flex items-center justify-between py-7 group"
                                >
                                    <span className={`text-[17px] font-medium transition-all duration-300 ${expandedKey === "nft" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-900 hover:text-gray-600"}`}>
                                        NFT Verify
                                    </span>
                                    <motion.div
                                        animate={{ rotate: expandedKey === "nft" ? 180 : 0 }}
                                        className="text-gray-400 group-hover:text-gray-900 transition-colors"
                                    >
                                        <ChevronDown size={22} strokeWidth={1} />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {expandedKey === "nft" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden pb-8"
                                        >
                                            <div className="pt-2">
                                                {arcticLoading ? (
                                                    <div className="flex items-center gap-3 text-gray-400 py-2">
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span className="text-sm">Verifying assets...</span>
                                                    </div>
                                                ) : arcticData.hasNFT ? (
                                                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                                            <Check size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-green-800">Verified Holder</div>
                                                            <div className="text-xs text-green-600">{arcticData.nftDetails?.name || "Arctic Penguin"}</div>
                                                        </div>
                                                        {arcticData.nftDetails?.image && (
                                                            <img src={arcticData.nftDetails.image} alt="NFT" className="w-10 h-10 rounded-md object-cover shadow-sm" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                                            NFT
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">No NFT Found</div>
                                                            <div className="text-xs text-gray-500">Hold an Arctic Penguin to unlock perks.</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="border-b border-gray-200/60">
                                <button 
                                    onClick={() => setExpandedKey(expandedKey === "connections" ? null : "connections")}
                                    className="w-full flex items-center justify-between py-7 group"
                                >
                                    <span className={`text-[17px] font-medium transition-all duration-300 ${expandedKey === "connections" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-900 hover:text-gray-600"}`}>
                                        Device Connections
                                    </span>
                                    <motion.div
                                        animate={{ rotate: expandedKey === "connections" ? 180 : 0 }}
                                        className="text-gray-400 group-hover:text-gray-900 transition-colors"
                                    >
                                        <ChevronDown size={22} strokeWidth={1} />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {expandedKey === "connections" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden pb-8"
                                        >
                                            <div className="pt-2">
                                                <FitbitConnector variant="row" />
                                                <p className="text-xs text-gray-400 mt-4 pr-12 leading-relaxed">
                                                    Seamlessly sync your activity data from Fitbit to track progress and unlock rewards.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="border-b border-gray-200/60" />
                        </div>

                        <div className="p-8 space-y-4 font-roboto">
                            <button 
                                onClick={handleLogout}
                                className="w-full py-4 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 shadow-sm group"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Sign out of Puffer Walks
                            </button>
                            
                            <button 
                                onClick={onClose}
                                className="w-full text-[11px] font-bold text-gray-300 hover:text-gray-900 transition-colors tracking-tight"
                            >
                                Close Sidebar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

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
import { useSound } from "../hooks/useSound";
import { MODULE_ADDRESS } from "../GameOnchain/movement_service/constants";

interface WalletPanelProps {
    isOpen: boolean;
    onClose: () => void;
}
import pfpFrame from "../assets/gameframe/pfpframe.png";
import buttonBg from "../assets/gameframe/button.png";
import cancelBg from "../assets/gameframe/cancel.png";
import blueBg from "../assets/blue.jpg";
import userAvatar from "../assets/user-avatar.png";

export function WalletPanel({ isOpen, onClose }: WalletPanelProps) {
    const { address: rawAddress } = useAccount();
    const { disconnect, signAndSubmitTransaction, connected } = useWallet();
    const { playClick } = useSound();
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    
    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const address = rawAddress?.toLowerCase();
    const { 
        username: initialUsername, 
        profileImage: initialImage, 
        isLoading: profileLoading,
        refresh: refreshProfile,
        hasOnChainProfile,
        hasFirebaseProfile
    } = useProfile(address);

    const [profileName, setProfileName] = useState("Puffer User");
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const { data: arcticData, isLoading: arcticLoading } = useArcticPenguin(address);

    const isLoading = profileLoading || arcticLoading;

    const shortAddress = address?.slice(0, 6) + '...' + address?.slice(-4);

    // Initial expanded state based on NFT ownership
    useEffect(() => {
        if (!arcticLoading) {
            setExpandedKey(arcticData?.hasNFT ? "profile" : "nft");
        }
    }, [arcticLoading, arcticData?.hasNFT]);

    // Sync state with hook data
    useEffect(() => {
        if (!isEditing && !isLoading) {
            if (initialUsername) setProfileName(initialUsername);
            if (initialImage) setProfileImage(initialImage);
        }
    }, [initialUsername, initialImage, isEditing, isLoading]);

    const handleLogout = async () => {
        playClick();
        try {
            if (connected) {
                await disconnect();
            }
        } catch (error) {
            console.error("Disconnect error:", error);
        }
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
        if (!address) return;
        setIsSaving(true);
        try {
            let finalImageUrl = profileImage;
            if (profileImage && profileImage.startsWith('data:image')) {
                finalImageUrl = await uploadToPinata(profileImage);
            }

            const response = await signAndSubmitTransaction({
                payload: {
                    function: `${MODULE_ADDRESS}::profile::create_profile`,
                    functionArguments: [profileName, finalImageUrl || ""],
                }
            });
            
            if (response) {
                console.log("Profile saved on-chain!");
                await saveChanges(); // Also sync to firebase
                await refreshProfile();
            }
        } catch (err: any) {
            console.error("Error saving on-chain:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEdit = () => {
        if (!arcticData?.hasNFT && !isEditing) return;
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

    const buttonStyle = {
        backgroundImage: `url(${buttonBg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    };

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
                        transition={{ type: "spring", damping: 35, stiffness: 400, duration: 0.2 }}
                        style={{ backgroundImage: `url(${blueBg})` }}
                        className="relative w-full max-w-md bg-cover bg-center shadow-2xl flex flex-col h-full overflow-hidden border-l border-white/10"
                    >
                        {/* Overlay to ensure readability */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0" />

                        <div className="relative z-10 flex flex-col h-full flex-1">
                            <div className="absolute top-7 left-8 z-20">
                                <button 
                                    onClick={() => { playClick(); onClose(); }}
                                    className="w-10 h-10 flex items-center justify-center text-black font-xirod text-xs hover:opacity-80 transition-opacity"
                                    style={{ 
                                        backgroundImage: `url(${cancelBg})`,
                                        backgroundSize: '100% 100%',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                >
                                    X
                                </button>
                            </div>

                            <div className="absolute top-7 right-8 z-10 flex flex-col items-end gap-2">
                                {!isEditing && hasFirebaseProfile && !hasOnChainProfile && (
                                    <button 
                                        onClick={() => { playClick(); saveOnChain(); }}
                                        disabled={isSaving}
                                        className="text-[9px] font-xirod bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-all flex items-center gap-2 animate-pulse shadow-lg shadow-blue-600/40 border border-blue-400/30"
                                    >
                                        {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                        Notarize on Movement
                                    </button>
                                )}
                                <button 
                                    onClick={() => { playClick(); toggleEdit(); }}
                                    disabled={isSaving || isLoading}
                                    className={`text-[10px] font-xirod transition-all px-4 py-1.5 rounded-full border flex items-center gap-2 ${
                                        isEditing 
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                            : "bg-black/20 border-white/20 text-white hover:bg-black/40"
                                    }`}
                                >
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                                    {isEditing ? "Save Local" : "Edit Account"}
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 space-y-2 no-scrollbar pt-20">
                                <div className="border-b border-white/10 pb-2">
                                    <button 
                                        onClick={() => { 
                                            playClick(); 
                                            setExpandedKey(expandedKey === "profile" ? null : "profile"); 
                                        }}
                                        className="w-full flex items-center justify-between py-6 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[12px] font-xirod transition-all duration-300 ${expandedKey === "profile" ? "text-white border-b-2 border-white" : "text-white/80 group-hover:text-white"}`}>
                                                Wallet Profile
                                            </span>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedKey === "profile" ? 180 : 0 }}
                                            className="text-white/60 group-hover:text-white transition-colors"
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
                                                transition={{ duration: 0.15, ease: "circOut" }}
                                                className="overflow-hidden pb-8"
                                            >
                                                <div className="flex flex-col items-center space-y-6 pt-4 text-center">
                                                    <div className="relative w-28 h-28 flex items-center justify-center">
                                                        <img src={pfpFrame} alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none z-0" />
                                                        <div 
                                                            className={`relative w-[75%] h-[75%] rounded-full overflow-hidden bg-black/40 flex items-center justify-center z-10 ${isEditing ? "cursor-pointer" : ""}`}
                                                            onClick={handlePfpClick}
                                                        >
                                                            {isLoading ? (
                                                                <Loader2 size={32} className="animate-spin opacity-40" />
                                                            ) : (profileImage && profileImage.trim() !== "") ? (
                                                                <img src={profileImage} alt="Profile" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img src={userAvatar} alt="Default Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-50" />
                                                            )}
                                                            
                                                            {isEditing && !isLoading && (
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
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
                                                                    className="w-full bg-transparent border-b-2 border-white text-center font-xirod text-sm text-white outline-none pb-2 placeholder:text-white/40"
                                                                    autoFocus
                                                                    placeholder="Choose a name"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm font-xirod text-white leading-tight">
                                                                {isLoading ? "Loading..." : profileName}
                                                            </div>
                                                        )}
                                                        <div className="text-[12px] font-bold text-white/50 px-4 py-1.5 bg-black/40 rounded-full border border-white/10 tracking-tight">
                                                            {shortAddress}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="border-b border-white/10">
                                    <button 
                                        onClick={() => { playClick(); setExpandedKey(expandedKey === "nft" ? null : "nft"); }}
                                        className="w-full flex items-center justify-between py-7 group"
                                    >
                                        <span className={`text-[12px] font-xirod transition-all duration-300 ${expandedKey === "nft" ? "text-white border-b-2 border-white" : "text-white/80 hover:text-white"}`}>
                                            NFT Verify
                                        </span>
                                        <motion.div
                                            animate={{ rotate: expandedKey === "nft" ? 180 : 0 }}
                                            className="text-white/60 group-hover:text-white transition-colors"
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
                                                transition={{ duration: 0.15, ease: "circOut" }}
                                                className="overflow-hidden pb-8"
                                            >
                                                <div className="pt-2">
                                                    {arcticLoading ? (
                                                        <div className="flex items-center gap-3 text-white/40 py-2">
                                                            <Loader2 size={16} className="animate-spin" />
                                                            <span className="text-sm">Verifying assets...</span>
                                                        </div>
                                                    ) : arcticData?.hasNFT ? (
                                                        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                                                <Check size={24} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-bold text-green-400">Verified Holder</div>
                                                                <div className="text-xs text-green-400/80">{arcticData.nftDetails?.name || "Arctic Penguin"}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center text-white/40 font-bold text-xs">
                                                                Nft
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white">No NFT Found</div>
                                                                <div className="text-xs text-white/60">Hold an Arctic Penguin to unlock perks.</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="border-b border-white/10">
                                    <button 
                                        onClick={() => { 
                                            playClick(); 
                                            setExpandedKey(expandedKey === "connections" ? null : "connections"); 
                                        }}
                                        className="w-full flex items-center justify-between py-7 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[12px] font-xirod transition-all duration-300 ${expandedKey === "connections" ? "text-white border-b-2 border-white" : "text-white/80 group-hover:text-white"}`}>
                                                Connections
                                            </span>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedKey === "connections" ? 180 : 0 }}
                                            className="text-white/60 group-hover:text-white transition-colors"
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
                                                transition={{ duration: 0.15, ease: "circOut" }}
                                                className="overflow-hidden pb-8"
                                            >
                                                <div className="pt-2 space-y-4">
                                                    <FitbitConnector variant="row" disabled={false} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="p-8 space-y-4">
                                <button 
                                    onClick={handleLogout}
                                    style={buttonStyle}
                                    className="w-full h-16 text-black font-xirod text-xs hover:opacity-90 transition-all flex items-center justify-center gap-3"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

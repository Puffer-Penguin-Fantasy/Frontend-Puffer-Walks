import { useAccount } from "@razorlabs/razorkit"
import React from "react"
import SettingsIcon from "@mui/icons-material/Settings";
import { db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useGame } from "../hooks/useGame"

interface HeaderProps {
    onOpenWallet: () => void;
    onOpenAdmin?: () => void;
}

export function Header({ onOpenWallet, onOpenAdmin }: HeaderProps) {
    const { address, isConnected } = useAccount()
    const { adminAddress } = useGame()
    const [profileImage, setProfileImage] = React.useState<string | null>(null)

    const normalizedAddress = address?.toLowerCase();

    const standardize = (addr: string | null | undefined) => {
        if (!addr) return "";
        let clean = addr.toLowerCase();
        if (!clean.startsWith("0x")) clean = "0x" + clean;
        return clean;
    };

    const isAdmin = normalizedAddress && adminAddress && standardize(normalizedAddress) === standardize(adminAddress);

    React.useEffect(() => {
        if (!normalizedAddress) return;
        const fetchProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", normalizedAddress));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.profileImage) setProfileImage(data.profileImage);
                }
            } catch (err) {
                console.error("Error fetching header profile:", err);
            }
        };
        fetchProfile();
    }, [normalizedAddress]);

    const shortAddress = normalizedAddress
        ? normalizedAddress.slice(0, 6) + '...' + normalizedAddress.slice(-4)
        : '';

    return (
        <header className="fixed top-0 left-0 right-0 z-[1000] bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-4 md:px-6">
            <div className="w-full flex justify-between items-center max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.location.href = "/"}>
                        <span className="text-[22px] font-medium text-foreground tracking-tight">Puffer Walks</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2.5">
                    {isConnected && (
                        <button
                            onClick={onOpenWallet}
                            className="hidden sm:flex px-4 py-1.5 rounded-full bg-muted hover:bg-muted/80 border border-border transition-all items-center gap-2 mr-2 group"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-sm font-semibold text-muted-foreground font-mono tracking-tight group-hover:text-accent transition-colors">
                                {shortAddress}
                            </span>
                        </button>
                    )}

                    {isAdmin && onOpenAdmin && (
                        <button
                            onClick={onOpenAdmin}
                            className="w-10 h-10 rounded-full bg-muted text-foreground border border-border flex items-center justify-center hover:bg-muted/80 transition-all mr-2 shadow-sm"
                            title="Admin Protocol Settings"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={onOpenWallet}
                        className="ml-1 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-2 border-border shadow-sm ring-1 ring-border overflow-hidden hover:scale-105 transition-transform"
                    >
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-medium tracking-tighter opacity-80 uppercase">0x</span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    )
}

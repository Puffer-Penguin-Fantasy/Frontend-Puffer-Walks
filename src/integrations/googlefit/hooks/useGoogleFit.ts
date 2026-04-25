import { useState, useEffect, useCallback } from "react";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_SCOPES } from "../config";
import { useAccount } from "@razorlabs/razorkit";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

const isDev = import.meta.env.DEV;
const AUTH_SERVER = isDev ? (import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3001") : "";

export function useGoogleFit() {
    const { address: rawAddress } = useAccount();
    const walletAddress = rawAddress?.toLowerCase()?.trim() || null;
    const standardizedWallet = walletAddress && !walletAddress.startsWith("0x") ? `0x${walletAddress}` : walletAddress;

    const [isConnected, setIsConnected] = useState(false);
    const [steps, setSteps] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // ── Real-time connection status from Firestore ──────────────────────────
    useEffect(() => {
        if (!standardizedWallet) {
            setIsConnected(false);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "googlefit_tokens", standardizedWallet),
            (snap) => {
                if (snap.exists() && snap.data()?.connected === true) {
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                    setSteps(null);
                }
            },
            (err) => {
                console.error("Firestore GoogleFit status error:", err);
                setIsConnected(false);
            }
        );

        return () => unsubscribe();
    }, [standardizedWallet]);

    // ── Fetch steps via backend (auto-refresh tokens) ────────────────────────
    const fetchSteps = useCallback(async (customDateStr?: string) => {
        if (!standardizedWallet || !isConnected) return 0;

        setIsSyncing(true);
        try {
            const dateStr = customDateStr || new Date().toISOString().split("T")[0];

            const res = await fetch(`${AUTH_SERVER}/auth/googlefit/steps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: standardizedWallet, date: dateStr }),
            });

            if (res.status === 401) {
                setIsConnected(false);
                toast.error("Google Fit session expired. Please reconnect.");
                return 0;
            }

            if (!res.ok) throw new Error(`Steps API error: ${res.status}`);

            const data = await res.json();
            const stepCount = data.steps ?? 0;

            if (!customDateStr) {
                setSteps(stepCount);
            }
            return stepCount;
        } catch {
            return 0;
        } finally {
            setIsSyncing(false);
        }
    }, [standardizedWallet, isConnected]);

    // Auto-poll steps every 5 minutes when connected (Oracle syncs are not per-minute)
    useEffect(() => {
        if (!isConnected) return;
        fetchSteps();
        const interval = setInterval(() => fetchSteps(), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isConnected, fetchSteps]);

    const connect = () => {
        if (!standardizedWallet) {
            toast.error("Please connect your wallet first");
            return;
        }

        const params = new URLSearchParams({
            response_type: "code",
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            scope: GOOGLE_SCOPES.join(" "),
            access_type: "offline",
            prompt: "consent",
            state: standardizedWallet,
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        window.location.href = authUrl;
    };

    const disconnect = async () => {
        if (!standardizedWallet) return;

        try {
            await fetch(`${AUTH_SERVER}/auth/googlefit/disconnect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: standardizedWallet }),
            });
            setIsConnected(false);
            setSteps(null);
            toast.success("Google Fit disconnected");
        } catch {
            toast.error("Failed to disconnect Google Fit");
        }
    };

    return {
        isConnected,
        steps,
        isSyncing,
        fetchSteps,
        connect,
        disconnect,
    };
}

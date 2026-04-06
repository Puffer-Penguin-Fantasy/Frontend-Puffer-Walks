import { useState, useEffect, useCallback } from "react";
import { useAccount } from "@razorlabs/razorkit";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

const isDev = import.meta.env.DEV;
const AUTH_SERVER = isDev ? (import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3001") : "";

export function useFitbit() {
  const { address: rawAddress } = useAccount();
  const walletAddress = rawAddress?.toLowerCase()?.trim() || null;
  // Ensure the address is standardized with 0x prefix if needed
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

    // Listen to the fitbit_tokens doc for this wallet in real-time
    const unsubscribe = onSnapshot(
      doc(db, "fitbit_tokens", standardizedWallet),
      (snap) => {
        if (snap.exists() && snap.data()?.connected === true) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setSteps(null);
        }
      },
      () => {
        // Silent error for status listener (usually missing Firestore permission or project init)
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [standardizedWallet]);

  // ── Fetch steps via oracle backend (auto-refresh tokens) ─────────────────
  const fetchSteps = useCallback(async (customDateStr?: string) => {
    if (!standardizedWallet || !isConnected) return 0;

    setIsSyncing(true);
    try {
      const dateStr = customDateStr || new Date().toISOString().split("T")[0];

      const res = await fetch(`${AUTH_SERVER}/auth/fitbit/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: standardizedWallet, date: dateStr }),
      });

      if (res.status === 401) {
        // Token was revoked — mark as disconnected
        setIsConnected(false);
        toast.error("Fitbit session expired. Please reconnect.");
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
      // Quietly handle connection blips
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, [standardizedWallet, isConnected]);

  // ── Auto-poll steps every 60s when connected ──────────────────────────────
  useEffect(() => {
    if (!isConnected) return;
    fetchSteps();
    const interval = setInterval(() => fetchSteps(), 60000);
    return () => clearInterval(interval);
  }, [isConnected, fetchSteps]);

  // ── Connect: redirect user through oracle auth server ────────────────────
  const connect = useCallback(async () => {
    if (!standardizedWallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Get the OAuth URL from the oracle server (which knows the client_secret)
      const res = await fetch(`${AUTH_SERVER}/auth/fitbit/url?wallet=${standardizedWallet}`);
      if (!res.ok) throw new Error("Failed to get auth URL");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Failed to start Fitbit connection");
    }
  }, [standardizedWallet]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (!standardizedWallet) return;

    try {
      await fetch(`${AUTH_SERVER}/auth/fitbit/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: standardizedWallet }),
      });
      setIsConnected(false);
      setSteps(null);
      toast.success("Fitbit disconnected");
    } catch {
      toast.error("Failed to disconnect Fitbit");
    }
  }, [standardizedWallet]);

  return {
    isConnected,
    steps,
    isSyncing,
    fetchSteps,
    connect,
    disconnect,
  };
}

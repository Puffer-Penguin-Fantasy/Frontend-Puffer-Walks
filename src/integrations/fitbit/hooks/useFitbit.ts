import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "@razorlabs/razorkit";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

const isDev = import.meta.env.DEV;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_URL || (isDev ? "http://localhost:3001" : "");

export function useFitbit() {
  const { address: rawAddress } = useAccount();
  const walletAddress = rawAddress?.toLowerCase()?.trim() || null;
  const standardizedWallet = walletAddress && !walletAddress.startsWith("0x")
    ? `0x${walletAddress}`
    : walletAddress;

  const [isConnected, setIsConnected] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ✅ Sync refs synchronously during render to avoid useEffect race conditions
  const isConnectedRef = useRef(isConnected);
  const walletRef = useRef(standardizedWallet);

  isConnectedRef.current = isConnected;
  walletRef.current = standardizedWallet;

  // ── Real-time connection status ──────────────────────────────────────────
  useEffect(() => {
    if (!standardizedWallet) {
      setIsConnected(false);
      return;
    }

    
    const unsubscribe = onSnapshot(
      doc(db, "fitbit_tokens", standardizedWallet),
      (snap) => {
        const data = snap.data();
        const connected = snap.exists() && data?.connected === true;
        
        setIsConnected(connected);
        if (!connected) setSteps(null);
      },
      (err) => {
        console.error("[useFitbit] Snapshot error:", err);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [standardizedWallet]);

  // ✅ fetchSteps always uses the latest ref values
  const fetchSteps = useCallback(async (customDateStr?: string) => {
    const wallet = walletRef.current;
    const connected = isConnectedRef.current;

    

    if (!wallet || !connected) {
      
      return 0;
    }

    setIsSyncing(true);
    try {
      const dateStr = customDateStr || new Date().toISOString().split("T")[0];
      

      const res = await fetch(`${AUTH_SERVER}/auth/fitbit/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, date: dateStr }),
      });

      if (res.status === 401) {
        console.error("[useFitbit] 401 Unauthorized - session expired");
        setIsConnected(false);
        toast.error("Fitbit session expired. Please reconnect.");
        return 0;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Steps API error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      const stepCount = data.steps ?? 0;
      

      if (!customDateStr) {
        setSteps(stepCount);
      }
      return stepCount;
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        console.warn("[useFitbit] Auth server not reachable. Ensure backend is running on 3001.");
      } else {
        console.error("[useFitbit] fetchSteps error:", err);
      }
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, []); // ✅ stable

  // ✅ Auto-fetch when isConnected flips to true, poll every 5 min
  useEffect(() => {
    if (!isConnected) return;

    // Trigger immediate fetch
    fetchSteps();

    const interval = setInterval(() => fetchSteps(), 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isConnected]); // ✅ stable fetchSteps

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!standardizedWallet) {
      toast.error("Please connect your wallet first");
      return;
    }
    try {
      const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_FITBIT_REDIRECT_URI
        || `${window.location.origin}/auth/fitbit/callback`;
      const scope = "activity profile";
      const url = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${standardizedWallet}&prompt=login%20consent`;
      window.location.href = url;
    } catch (err) {
      console.error("Fitbit connection error:", err);
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

  return { isConnected, steps, isSyncing, fetchSteps, connect, disconnect };
}

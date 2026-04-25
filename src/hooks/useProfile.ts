import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { aptosClient } from "../GameOnchain/movement_service/movement-client";
import { MODULE_ADDRESS } from "../GameOnchain/movement_service/constants";

export interface ProfileData {
  username: string;
  profileImage: string | null;
  hasFirebaseProfile: boolean;
  hasOnChainProfile: boolean;
  isLoading: boolean;
}

const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useProfile(address: string | null | undefined) {
  const normalizedAddr = address?.toLowerCase();
  
  // Use localStorage for instant initial state to prevent flickering
  const getCachedProfile = () => {
    if (typeof window === "undefined" || !normalizedAddr) return null;
    const cached = localStorage.getItem(`puffer_profile_${normalizedAddr}`);
    return cached ? JSON.parse(cached) : null;
  };

  const cachedData = getCachedProfile();

  const [profile, setProfile] = useState<ProfileData>({
    username: cachedData?.username || "Puffer User",
    profileImage: cachedData?.profileImage || null,
    hasFirebaseProfile: !!cachedData,
    hasOnChainProfile: cachedData?.hasOnChainProfile || false,
    isLoading: !cachedData,
  });

  const fetchProfile = useCallback(async (force = false) => {
    if (!address) {
      setProfile(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Skip full fetch if cache is still fresh (unless forced)
    if (!force && cachedData) {
      const age = Date.now() - (cachedData.cachedAt || 0);
      if (age < PROFILE_CACHE_TTL) {
        setProfile(prev => ({ ...prev, isLoading: false }));
        return;
      }
    }

    setProfile(prev => ({ ...prev, isLoading: true }));
    
    try {
      // 1. Fetch from Firebase
      const userRef = doc(db, "users", address);
      const userDoc = await getDoc(userRef);
      let firebaseData = { username: "Puffer User", profileImage: null as string | null, hasFirebaseProfile: false };
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        firebaseData = {
          username: data.username || "Puffer User",
          profileImage: data.profileImage || null,
          hasFirebaseProfile: true,
        };
      }

      // 2. Check On-chain status
      let hasOnChain = cachedData?.hasOnChainProfile || false;
      try {
        const result = await aptosClient.view({
          payload: {
            function: `${MODULE_ADDRESS}::profile::has_profile`,
            typeArguments: [],
            functionArguments: [address],
          },
        });
        hasOnChain = result[0] as boolean;
      } catch (err) {
        console.error("Error checking on-chain profile:", err);
      }

      setProfile({
        ...firebaseData,
        hasOnChainProfile: hasOnChain,
        isLoading: false,
      });

      // Cache with timestamp
      localStorage.setItem(`puffer_profile_${address.toLowerCase()}`, JSON.stringify({
        username: firebaseData.username,
        profileImage: firebaseData.profileImage,
        hasOnChainProfile: hasOnChain,
        cachedAt: Date.now(),
      }));
    } catch (err) {
      console.error("Error fetching full profile:", err);
      setProfile(prev => ({ ...prev, isLoading: false }));
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [address, fetchProfile]);

  return {
    ...profile,
    refresh: () => fetchProfile(true), // force = true bypasses cache
  };
}

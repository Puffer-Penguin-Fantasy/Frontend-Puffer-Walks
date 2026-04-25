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
    hasOnChainProfile: false,
    isLoading: !cachedData,
  });

  const fetchProfile = useCallback(async () => {
    if (!address) {
      setProfile(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setProfile(prev => ({ ...prev, isLoading: true }));
    console.log("useProfile: fetching for address:", address);
    
    try {
      // 1. Fetch from Firebase
      const userRef = doc(db, "users", address);
      const userDoc = await getDoc(userRef);
      let firebaseData = { username: "Puffer User", profileImage: null as string | null, hasFirebaseProfile: false };
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("useProfile: found Firebase data:", data);
        firebaseData = {
          username: data.username || "Puffer User",
          profileImage: data.profileImage || null,
          hasFirebaseProfile: true,
        };
      } else {
        console.log("useProfile: no Firebase document found for:", address);
      }

      // 2. Check On-chain status
      let hasOnChain = false;
      try {
        const result = await aptosClient.view({
          payload: {
            function: `${MODULE_ADDRESS}::profile::has_profile`,
            typeArguments: [],
            functionArguments: [address],
          },
        });
        hasOnChain = result[0] as boolean;
        console.log("useProfile: on-chain status:", hasOnChain);
      } catch (err) {
        console.error("Error checking on-chain profile:", err);
      }

      setProfile({
        ...firebaseData,
        hasOnChainProfile: hasOnChain,
        isLoading: false,
      });

      // Cache for next time
      if (address) {
        localStorage.setItem(`puffer_profile_${address.toLowerCase()}`, JSON.stringify({
          username: firebaseData.username,
          profileImage: firebaseData.profileImage
        }));
      }
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
    refresh: fetchProfile,
  };
}

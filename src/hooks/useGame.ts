import { useState, useCallback, useEffect, useRef } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useAccount, useWallet } from "@razorlabs/razorkit";
import { db } from "../lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { MODULE_ADDRESS, NETWORK_CONFIG } from "../GameOnchain/movement_service/constants";
import type { Game } from "../types/game";

const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM,
  fullnode: NETWORK_CONFIG.fullnode 
});
const aptosClient = new Aptos(aptosConfig);

const detectHash = (response: any): string | null => {
  if (typeof response === "string" && response.startsWith("0x")) {
    return response;
  }
  if (response && typeof response === "object") {
    const hash = response.hash || response.transactionHash || response.transaction_hash;
    if (hash && typeof hash === "string" && hash.startsWith("0x")) return hash;
    
    const values = Object.values(response);
    return (values.find(v => typeof v === "string" && v.startsWith("0x") && v.length === 66) as string) || null;
  }
  return null;
};

export function useGame() {
  const { address: rawAddress } = useAccount();
  const { signAndSubmitTransaction } = useWallet();
  const [games, setGames] = useState<Game[]>([]);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [secondaryAdminAddress, setSecondaryAdminAddress] = useState<string | null>(null);
  const [oracleAddress, setOracleAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchGames = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true);
    try {
      const resource = await aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType: `${MODULE_ADDRESS}::game::GameStore`,
      });

      setAdminAddress((resource as any).admin);
      setSecondaryAdminAddress((resource as any).secondary_admin);
      setOracleAddress((resource as any).oracle);

      const gamesResource = (resource as any).games;
      let rawGames = [];
      if (Array.isArray(gamesResource)) {
        rawGames = gamesResource;
      } else if (gamesResource?.inline_vec) {
        rawGames = gamesResource.inline_vec;
      } else if (gamesResource?.data) {
        rawGames = gamesResource.data;
      }

      const results = (rawGames as any[]).map((item: any) => {
        const g = item.value || item;
        let gameId = "unknown";
        if (g.id) {
          if (typeof g.id === 'string') gameId = g.id;
          else if (typeof g.id === 'object' && g.id.value) gameId = g.id.value;
          else if (Array.isArray(g.id)) gameId = g.id[0];
          else gameId = String(g.id);
        }

        return {
          id: gameId,
          name: typeof g.name === "object" ? g.name.value : (g.name || ""),
          image_url: typeof g.image_url === "object" ? g.image_url.value : (g.image_url || ""),
          slug: (typeof g.name === "object" ? g.name.value : (g.name || "")).toLowerCase().replace(/ /g, "-"),
          deposit_amount: g.deposit_amount || "0",
          min_daily_steps: g.min_daily_steps || "0",
          start_time: g.start_time || "0",
          end_time: g.end_time || "0",
          is_public: g.is_public,
          is_sponsored: (g.sponsors?.[0]?.amount || "0") !== "0",
          prize_pool: g.prize_vault?.value || "0",
          sponsored_pool: g.sponsored_vault?.value || "0",
          participants_count: Array.isArray(g.participants) ? g.participants.length : (g.participants?.value?.length || 0),
          participants: Array.isArray(g.participants) ? g.participants : (g.participants?.value || []),
          sponsor_name: g.sponsors?.[0]?.name?.value || g.sponsors?.[0]?.name || "",
          sponsor_amount: g.sponsors?.[0]?.amount || "0",
          sponsor_image_url: g.sponsors?.[0]?.image_url?.value || g.sponsors?.[0]?.image_url || "",
          no_of_days: g.no_of_days || "0",
          is_paused: g.is_paused || false,
          required_nft: typeof g.required_nft === "object" ? g.required_nft.value : (g.required_nft || "0x0"),
        };
      });

      // Merge metadata from Firestore for discovery
      const finalGames = await Promise.all(results.map(async (g) => {
        try {
          const metaRef = doc(db, "game_metadata", g.id);
          const metaSnap = await getDoc(metaRef);
          if (metaSnap.exists()) {
            return { ...g, joinCode: metaSnap.data().joinCode };
          }
        } catch (e) {
          console.warn(`⚠️ Could not fetch metadata for game ${g.id}:`, e);
        }
        return g;
      }));
 
      setGames(finalGames.filter(g => g.id !== "unknown"));
      return finalGames;
    } catch (err) {
      console.error("Error fetching games:", err);
      setGames([]);
      return [];
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
    }
  }, []);

  const joinGame = async (gameId: string, joinCode: string = "") => {
    if (!rawAddress) return;
    const walletAddress = rawAddress.toLowerCase();
    
    try {
      // 1. Submit on-chain transaction
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::join_game`,
          functionArguments: [
            gameId, 
            Array.from(new TextEncoder().encode(joinCode)), 
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          ],
        }
      });
      
      const hash = detectHash(response);
      if (hash) {
        await aptosClient.waitForTransaction({ transactionHash: hash });
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }

      // 2. Find game metadata and sync to Firestore
      const game = games.find(g => g.id === gameId);
      if (game) {
        const gameRef = doc(db, "games", gameId);
        await setDoc(gameRef, {
          name: game.name,
          startTime: parseInt(game.start_time),
          endTime: parseInt(game.end_time),
          numDays: parseInt(game.no_of_days),
          minSteps: parseInt(game.min_daily_steps),
          deposit: parseFloat(game.deposit_amount) / 100_000_000
        }, { merge: true });

        const userRef = doc(db, "users", walletAddress);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        // Healing & Sync: Ensure all on-chain participants are in Firestore with their profiles
        for (const pAddr of (game.participants || [])) {
          const standardizedPAddr = pAddr.toLowerCase();
          const pRef = doc(db, "games", gameId, "participants", standardizedPAddr);
          
          let pProfile = null;
          if (standardizedPAddr === walletAddress) {
            pProfile = userData;
          } else {
            const otherUserSnap = await getDoc(doc(db, "users", standardizedPAddr));
            pProfile = otherUserSnap.exists() ? otherUserSnap.data() : null;
          }

          await setDoc(pRef, {
            walletAddress: standardizedPAddr,
            username: pProfile?.username || null,
            profileImage: pProfile?.profileImage || null,
            joinedAt: Date.now(),
            isEliminated: false
          }, { merge: true });
        }

        await updateDoc(userRef, {
          activeGames: arrayUnion(gameId)
        });
      }

      await fetchGames();
      return response;
    } catch (err: any) {
      console.error("❌ Join Game Failed!", err);
      throw err;
    }
  };

  const createGame = async (params: {
    name: string,
    image_url: string,
    deposit: number,
    min_steps: number,
    start: number,
    end: number,
    is_public: boolean,
    code: string,
    sponsor_amount?: number,
    sponsor_name?: string,
    sponsor_image_url?: string
  }) => {
    if (!rawAddress) return;
    try {
      console.log("🚀 Creating game with params:", params);
      
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::create_game`,
          functionArguments: [
            params.name,
            params.image_url,
            Math.floor(params.deposit * 100_000_000).toString(),
            params.min_steps.toString(),
            params.start.toString(),
            params.end.toString(),
            params.is_public,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            Array.from(new TextEncoder().encode(params.code)),
            Math.floor((params.sponsor_amount || 0) * 100_000_000).toString(),
            params.sponsor_name || "",
            params.sponsor_image_url || ""
          ],
        }
      });
      
      console.log("💰 Create Game Response:", response);
      
      
      const hash = detectHash(response);
      
      if (!hash) {
        console.warn("⚠️ No transaction hash found in response, but submission might have succeeded. Response:", response);
        await new Promise(r => setTimeout(r, 2000));
        await fetchGames();
        return response;
      }
      
      console.log("📍 Detected transaction hash:", hash);
      await aptosClient.waitForTransaction({ transactionHash: hash });
      
      // Save metadata to Firestore for discovery (since on-chain only has hashes)
      const games = await fetchGames();
      if (games) {
        const newGame = games.find(g => g.name === params.name); // Find by name as fallback
        if (newGame) {
          await setDoc(doc(db, "game_metadata", newGame.id), {
            id: newGame.id,
            name: newGame.name,
            joinCode: params.code,
            isPublic: params.is_public,
            createdAt: Date.now()
          });
        }
      }

      await fetchGames();
      return response;
    } catch (err: any) {
      console.error("❌ Error creating game:", err);
      // Log more details if it's a JSON parse error
      if (err instanceof SyntaxError) {
        console.error("Possible RPC issue or invalid transaction payload format.");
      }
      throw err;
    }
  };

  const claimRewards = async (gameId: string) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::claim_rewards`,
          functionArguments: [gameId],
        }
      });
      
      const hash = detectHash(response);
      if (hash) {
        await aptosClient.waitForTransaction({ transactionHash: hash });
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error claiming rewards:", err);
      throw err;
    }
  };

  const updateSecondaryAdmin = async (newAdmin: string) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::set_secondary_admin`,
          functionArguments: [newAdmin],
        }
      });
      
      const hash = detectHash(response);
      if (hash) {
        await aptosClient.waitForTransaction({ transactionHash: hash });
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      await fetchGames();
    } catch (err) {
      console.error("Failed to set secondary admin:", err);
      throw err;
    }
  };

  const updateOracleAddress = async (newOracle: string) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::set_oracle`,
          functionArguments: [newOracle],
        }
      });
      
      const hash = detectHash(response);
      if (hash) {
        await aptosClient.waitForTransaction({ transactionHash: hash });
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      await fetchGames();
    } catch (err) {
      console.error("Failed to set oracle address:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    adminAddress,
    secondaryAdminAddress,
    oracleAddress,
    isLoading,
    refresh: fetchGames,
    joinGame,
    createGame,
    claimRewards,
    updateSecondaryAdmin,
    updateOracleAddress
  };
}

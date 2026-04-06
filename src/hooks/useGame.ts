import { useState, useCallback, useEffect, useRef } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { db } from "../lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { MODULE_ADDRESS, NETWORK_CONFIG } from "../GameOnchain/movement_service/constants";
import type { Game } from "../types/game";

const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM,
  fullnode: NETWORK_CONFIG.fullnode 
});
const aptosClient = new Aptos(aptosConfig);

export function useGame() {
  const { account, signAndSubmitTransaction } = useWallet();
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

      const formattedGames: Game[] = rawGames.map((item: any) => {
        const g = item.value || item;
        
        let gameId = "unknown";
        if (g.id) {
          if (typeof g.id === 'string') gameId = g.id;
          else if (typeof g.id === 'object' && g.id.value) gameId = g.id.value;
          else if (Array.isArray(g.id)) gameId = g.id[0];
          else gameId = String(g.id);
        }
        
        const name = typeof g.name === 'object' ? g.name.value : (g.name || gameId);
        const slug = name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        return {
          id: gameId,
          name,
          slug,
          image_url: typeof g.image_url === 'object' ? g.image_url.value : g.image_url,
          deposit_amount: g.deposit_amount,
          min_daily_steps: g.min_daily_steps,
          start_time: g.start_time,
          end_time: g.end_time,
          no_of_days: g.no_of_days,
          is_sponsored: g.is_sponsored,
          is_paused: g.is_paused,
          is_public: g.is_public,
          required_nft: g.required_nft,
          participants: Array.isArray(g.participants) 
            ? g.participants.map((p: any) => typeof p === "string" ? p : p.value || String(p)) 
            : [],
          prize_pool: g.prize_vault?.value || "0",
          sponsored_pool: g.sponsored_vault?.value || "0",
          participants_count: Array.isArray(g.participants) ? g.participants.length : (g.participants?.value?.length || 0),
          sponsor_name: typeof g.sponsor_name === "object" ? g.sponsor_name.value : (g.sponsor_name || ""),
          sponsor_amount: g.sponsor_amount || "0",
          sponsor_image_url: typeof g.sponsor_image_url === "object" ? g.sponsor_image_url.value : (g.sponsor_image_url || ""),
        };
      });

      setGames(formattedGames.filter(g => g.id !== "unknown"));
    } catch (err) {
      console.error("Error fetching games:", err);
      setGames([]);
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
    }
  }, []);

  const joinGame = async (gameId: string, joinCode: string = "") => {
    if (!account) return;
    const walletAddress = account.address.toString().toLowerCase();
    
    try {
      // 1. Submit on-chain transaction
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::game::join_game`,
          functionArguments: [
            gameId, 
            Array.from(new TextEncoder().encode(joinCode)), 
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          ],
        }
      });
      
      await aptosClient.waitForTransaction({ transactionHash: (response as any).hash });

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
    if (!account) return;
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::game::create_game`,
          functionArguments: [
            params.name,
            params.image_url,
            Math.floor(params.deposit * 100_000_000),
            params.min_steps,
            params.start,
            params.end,
            params.is_public,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            Array.from(new TextEncoder().encode(params.code)),
            Math.floor((params.sponsor_amount || 0) * 100_000_000),
            params.sponsor_name || "",
            params.sponsor_image_url || ""
          ],
        }
      });
      await aptosClient.waitForTransaction({ transactionHash: (response as any).hash });
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error creating game:", err);
      throw err;
    }
  };

  const claimRewards = async (gameId: string) => {
    if (!account) return;
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::game::claim_rewards`,
          functionArguments: [gameId],
        }
      });
      await aptosClient.waitForTransaction({ transactionHash: (response as any).hash });
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error claiming rewards:", err);
      throw err;
    }
  };

  const updateSecondaryAdmin = async (newAdmin: string) => {
    if (!account) return;
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::game::set_secondary_admin`,
          functionArguments: [newAdmin],
        }
      });
      await aptosClient.waitForTransaction({ transactionHash: (response as any).hash });
      await fetchGames();
    } catch (err) {
      console.error("Failed to set secondary admin:", err);
      throw err;
    }
  };

  const updateOracleAddress = async (newOracle: string) => {
    if (!account) return;
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::game::set_oracle`,
          functionArguments: [newOracle],
        }
      });
      await aptosClient.waitForTransaction({ transactionHash: (response as any).hash });
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

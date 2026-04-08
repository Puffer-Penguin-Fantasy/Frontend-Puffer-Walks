import { useState, useCallback, useRef, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useAccount, useWallet } from "@razorlabs/razorkit";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { Game } from "../types/game";

const MODULE_ADDRESS = "0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177";
const aptosConfig = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://testnet.movementnetwork.xyz/v1" });
const aptosClient = new Aptos(aptosConfig);

export function useGame() {
  const { address: rawAddress } = useAccount();
  const { signAndSubmitTransaction } = useWallet();
  const [games, setGames] = useState<Game[]>([]);
  const [adminAddress, setAdminAddress] = useState<string>("");
  const [secondaryAdminAddress, setSecondaryAdminAddress] = useState<string>("");
  const [oracleAddress, setOracleAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const resource = await aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType: `${MODULE_ADDRESS}::game::GameStore`
      });

      if (!resource) {
        console.error("GameStore resource not found at address:", MODULE_ADDRESS);
        return [];
      }

      setAdminAddress((resource as any).admin);
      setSecondaryAdminAddress((resource as any).secondary_admin);
      setOracleAddress((resource as any).oracle);

      const gamesResource = (resource as any).games;
      let rawGames = [];
      if (Array.isArray(gamesResource)) rawGames = gamesResource;
      else if (gamesResource?.inline_vec) rawGames = gamesResource.inline_vec;
      else if (gamesResource?.data) rawGames = gamesResource.data;

      const results = (rawGames as any[]).map((item: any) => {
        const g = item.value || item;
        let gameId = "unknown";
        if (g.id) {
          if (typeof g.id === 'string') gameId = g.id;
          else if (typeof g.id === 'object' && g.id.value) gameId = g.id.value;
          else if (Array.isArray(g.id)) gameId = g.id[0];
          else gameId = String(g.id);
        }

        const name = typeof g.name === "object" ? g.name.value : (g.name || "");
        return {
          id: gameId,
          name,
          image_url: typeof g.image_url === "object" ? g.image_url.value : (g.image_url || ""),
          slug: name.toLowerCase().replace(/ /g, "-"),
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

      // --- USER SPECIFIC STATUS FETCH ---
      let gamesWithClaimStatus = [...results];
      if (rawAddress) {
        try {
          const upResource = await aptosClient.getAccountResource({
            accountAddress: rawAddress,
            resourceType: `${MODULE_ADDRESS}::game::UserParticipation`
          }) as any;
          
          const gamesStatus = upResource?.games_status;
          const tableHandle = gamesStatus?.inner?.handle || gamesStatus?.handle;
          
          if (tableHandle) {
            const userAddrNorm = rawAddress.toLowerCase();
            gamesWithClaimStatus = await Promise.all(results.map(async (g) => {
              const isJoined = g.participants.some((p: any) => {
                const pAddr = typeof p === 'string' ? p : (p.value || "");
                return pAddr.toLowerCase() === userAddrNorm;
              });
              const isEnded = parseInt(g.end_time) < Math.floor(Date.now() / 1000);
              
              if (isJoined && isEnded) {
                try {
                  const progress = await aptosClient.getTableItem({
                    handle: tableHandle,
                    data: {
                      key_type: "u64",
                      value_type: `${MODULE_ADDRESS}::game::GameProgress`,
                      key: g.id 
                    }
                  }) as any;
                  
                  const compCount = Array.isArray(progress.days_completed) 
                    ? progress.days_completed.filter((met: boolean) => met).length 
                    : 0;

                  return { 
                    ...g, 
                    isClaimed: progress.has_withdrawn === true || progress.has_withdrawn === "true",
                    userCompletedDays: compCount,
                    userMissedDays: parseInt(progress.missed_days || "0")
                  };
                } catch (err) {
                  return g;
                }
              }
              return g;
            }));
          }
        } catch (e) { console.log("UserParticipation not found or error:", e); }
      }

      // --- MERGE FIREBASE METADATA ---
      const finalGames = await Promise.all(gamesWithClaimStatus.map(async (g) => {
        try {
          const metaRef = doc(db, "game_metadata", g.id);
          const metaSnap = await getDoc(metaRef);
          if (metaSnap.exists()) return { ...g, joinCode: metaSnap.data().joinCode };
        } catch (e) {
          console.warn(`Could not fetch metadata for ${g.id}:`, e);
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
  }, [rawAddress]);

  const detectHash = (response: any) => {
    if (!response) return null;
    if (typeof response === 'string' && response.startsWith('0x')) return response;
    if (response.hash) return response.hash;
    if (response.transactionHash) return response.transactionHash;
    if (response.args?.hash) return response.args.hash;
    return null;
  };

  const joinGame = async (gameId: string, joinCode: string = "") => {
    if (!rawAddress) return;
    try {
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
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));

      const game = games.find(g => g.id === gameId);
      if (game) {
        await setDoc(doc(db, "games", gameId), {
          name: game.name,
          startTime: parseInt(game.start_time),
          endTime: parseInt(game.end_time),
          numDays: parseInt(game.no_of_days),
          minSteps: parseInt(game.min_daily_steps),
          deposit: parseFloat(game.deposit_amount) / 100_000_000
        }, { merge: true });
      }
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error joining game:", err);
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
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error claiming rewards:", err);
      throw err;
    }
  };

  const createGame = async (params: {
    name: string,
    image_url: string,
    deposit_amount: number,
    min_daily_steps: number,
    start_time: number,
    no_of_days: number,
    is_public: boolean,
    join_code: string,
    required_nft: string
  }) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::publish_game`,
          functionArguments: [
            Array.from(new TextEncoder().encode(params.name)),
            Array.from(new TextEncoder().encode(params.image_url)),
            Math.floor(params.deposit_amount * 100_000_000),
            params.min_daily_steps,
            params.start_time,
            params.no_of_days,
            params.is_public,
            Array.from(new TextEncoder().encode(params.join_code)),
            params.required_nft || "0x0"
          ],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error creating game:", err);
      throw err;
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::cancel_game`,
          functionArguments: [gameId],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error deleting game:", err);
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
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error updating admin:", err);
      throw err;
    }
  };

  const updateOracleAddress = async (newOracle: string) => {
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::set_oracle_address`,
          functionArguments: [newOracle],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error updating oracle:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (!hasLoadedOnce.current) {
      fetchGames();
    }
  }, [fetchGames]);

  return {
    games,
    adminAddress,
    secondaryAdminAddress,
    oracleAddress,
    isLoading,
    refresh: fetchGames,
    joinGame,
    claimRewards,
    createGame,
    deleteGame,
    updateSecondaryAdmin,
    updateOracleAddress
  };
}

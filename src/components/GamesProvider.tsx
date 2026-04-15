import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useAccount, useWallet } from "@razorlabs/razorkit";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { Game } from "../types/game";

const MODULE_ADDRESS = "0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177";
const aptosConfig = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://testnet.movementnetwork.xyz/v1" });
const aptosClient = new Aptos(aptosConfig);

interface GamesContextType {
  games: Game[];
  adminAddress: string;
  secondaryAdminAddress: string;
  oracleAddress: string;
  isLoading: boolean;
  refresh: () => Promise<Game[]>;
  joinGame: (gameId: string, joinCode?: string) => Promise<any>;
  claimRewards: (gameId: string) => Promise<any>;
  createGame: (params: any) => Promise<any>;
  deleteGame: (gameId: string) => Promise<any>;
  updateSecondaryAdmin: (newAdmin: string) => Promise<any>;
  updateOracleAddress: (newOracle: string) => Promise<any>;
  claimAdminFees: (gameId: string) => Promise<any>;
  pinUser: (gameId: string) => Promise<any>;
  claimPinFees: (amount: number) => Promise<any>;
  claimLegacyPinFees: () => Promise<any>;
  getPinTreasuryBalance: () => Promise<number>;
  hashString: (input: string) => Promise<number[]>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: React.ReactNode }) {
  const { address: rawAddress } = useAccount();
  const { signAndSubmitTransaction } = useWallet();
  const [games, setGames] = useState<Game[]>([]);
  const [adminAddress, setAdminAddress] = useState<string>("");
  const [secondaryAdminAddress, setSecondaryAdminAddress] = useState<string>("");
  const [oracleAddress, setOracleAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const hexToBytes = (hex: string): number[] => {
    if (!hex) return [];
    let cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    // Handle Aptos resource format if it's already an array
    if (Array.isArray(hex)) return hex;
    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    return bytes;
  };

  // Helper to hash strings for blockchain privacy (SHA-256)
  const hashString = async (input: string): Promise<number[]> => {
    if (!input) return Array(32).fill(0);
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer));
  };

  const fetchGames = useCallback(async () => {
    try {
      // Only show skeletal loader on first ever load
      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }
      
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
          else if (typeof g.id === 'object' && (g.id as any).value) gameId = (g.id as any).value;
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
          daily_stake_standard: g.daily_stake_standard || "0",
          daily_stake_final: g.daily_stake_final || "0",
          daily_forfeited_pool: Array.isArray(g.daily_forfeited_pool) ? g.daily_forfeited_pool : (g.daily_forfeited_pool?.value || []),
          day_winners_count: Array.isArray(g.day_winners_count) ? g.day_winners_count : (g.day_winners_count?.value || []),
          perfect_winners_count: g.perfect_winners_count || "0",
          admin_claimed: g.admin_claimed || false,
          join_code_hash: hexToBytes(typeof g.join_code === "object" ? g.join_code.value : (g.join_code || "")),
        };
      });

      let gamesWithClaimStatus = [...results];
      if (rawAddress) {
        const userAddrNorm = rawAddress.toLowerCase();
        const hasJoinedAnyGame = results.some(g => g.participants.some((p: any) => {
            const pAddr = typeof p === 'string' ? p : (p.value || "");
            return pAddr.toLowerCase() === userAddrNorm;
        }));

        if (hasJoinedAnyGame) {
          try {
            const upResource = await aptosClient.getAccountResource({
              accountAddress: rawAddress,
              resourceType: `${MODULE_ADDRESS}::game::UserParticipation`
            }) as any;
            
            const gamesStatus = upResource?.games_status;
            const tableHandle = gamesStatus?.inner?.handle || gamesStatus?.handle;
          
            if (tableHandle) {
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
                    
                    const compCount = Array.isArray(progress?.days_completed) 
                      ? progress.days_completed.filter((met: boolean) => met).length 
                      : 0;

                    return { 
                      ...g, 
                      isClaimed: progress?.has_withdrawn === true || progress?.has_withdrawn === "true",
                      userCompletedDays: compCount,
                      userMissedDays: parseInt(progress?.missed_days || "0"),
                      days_completed: progress?.days_completed || []
                    };
                  } catch (err) {
                    return { ...g, isClaimed: false, userCompletedDays: 0, userMissedDays: 0 };
                  }
                }
                return { ...g, isClaimed: false };
              }));
            }
          } catch (e) { }
        }
      }

      const finalGames = results.map(g => {
        const withStatus = gamesWithClaimStatus.find(gw => gw.id === g.id);
        return { ...g, ...withStatus };
      });
  
      setGames(finalGames.filter(g => g.id !== "unknown"));
      return finalGames;
    } catch (err) {
      console.error("Error fetching games:", err);
      // setGames([]); // Don't clear existing data on refresh error
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
      const hashedCode = await hashString(joinCode);
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::join_game`,
          functionArguments: [
            gameId, 
            hashedCode, 
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

        const initialDays: Record<string, number> = {};
        for(let i = 1; i <= parseInt(game.no_of_days); i++){
          initialDays[`day${i}`] = 0;
        }

        await setDoc(doc(db, "games", gameId, "participants", rawAddress.toLowerCase()), {
          walletAddress: rawAddress.toLowerCase(),
          joinedAt: new Date(),
          days: initialDays
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

  const createGame = async (params: any) => {
    if (!rawAddress) return;
    try {
      const hashedCode = await hashString(params.join_code || "");
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::create_game`,
          functionArguments: [
            Array.from(new TextEncoder().encode(params.name)),
            Array.from(new TextEncoder().encode(params.image_url)),
            Math.floor(params.deposit_amount * 100_000_000),
            params.min_daily_steps,
            params.start_time,
            params.start_time + (params.no_of_days * 86400),
            params.is_public,
            params.required_nft || "0x0",
            hashedCode,
            Math.floor((params.sponsor_amount || 0) * 100_000_000),
            Array.from(new TextEncoder().encode(params.sponsor_name || "")),
            Array.from(new TextEncoder().encode(params.sponsor_image_url || ""))
          ],
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

  const claimAdminFees = async (gameId: string) => {
    if (!rawAddress) return;
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::game::claim_admin_fees`,
          functionArguments: [gameId],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));
      await fetchGames();
      return response;
    } catch (err) {
      console.error("Error claiming admin fees:", err);
      throw err;
    }
  };

  const pinUser = async (gameId: string) => {
    if (!rawAddress) return;
    try {
      // 1. Call the contract
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::puffer_pins::pin_user`,
          functionArguments: [gameId],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));

      // 2. Update Firestore with a 3-week expiration
      const THREE_WEEKS_IN_MS = 21 * 24 * 60 * 60 * 1000;
      const pinnedUntil = Date.now() + THREE_WEEKS_IN_MS;

      await setDoc(doc(db, "games", gameId, "participants", rawAddress.toLowerCase()), {
        isPinned: true,
        pinnedUntil: pinnedUntil
      }, { merge: true });

      return response;
    } catch (err) {
      console.error("Error pinning user:", err);
      throw err;
    }
  };

  const claimPinFees = async (amount: number) => {
    if (!rawAddress) return;
    try {
      // amount is in MOVE, converted to 8 decimals
      const octas = Math.floor(amount * 100_000_000);
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::puffer_pins::claim_treasury`,
          functionArguments: [octas.toString()],
        }
      });
      const hash = detectHash(response);
      if (hash) await aptosClient.waitForTransaction({ transactionHash: hash });
      else await new Promise(r => setTimeout(r, 2000));
      return response;
    } catch (err) {
      console.error("Error claiming pin fees:", err);
      throw err;
    }
  };

  const claimLegacyPinFees = async () => {
    if (!rawAddress) return;
    try {
      // 1. Try to claim from 'leaderboard_pins'
      await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::leaderboard_pins::claim_treasury`,
          functionArguments: [],
        }
      });
      // 2. Try to claim from 'pinned'
      await signAndSubmitTransaction({
        payload: {
          function: `${MODULE_ADDRESS}::pinned::claim_treasury`,
          functionArguments: [],
        }
      });
      return true;
    } catch (err) {
      console.error("Error sweeping legacy fees:", err);
      throw err;
    }
  };

  const getPinTreasuryBalance = async (): Promise<number> => {
    try {
      const result = await aptosClient.view({
        payload: {
          function: `${MODULE_ADDRESS}::puffer_pins::get_treasury_balance`,
          functionArguments: [],
        }
      });
      // Returns value in octas, convert to MOVE (8 decimals)
      return (Number(result[0]) || 0) / 100_000_000;
    } catch (err) {
      console.error("Error fetching pin treasury balance:", err);
      return 0;
    }
  };

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <GamesContext.Provider value={{
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
      updateOracleAddress,
      claimAdminFees,
      pinUser,
      claimPinFees,
      claimLegacyPinFees,
      getPinTreasuryBalance,
      hashString
    }}>
      {children}
    </GamesContext.Provider>
  );
}

export const useGamesContext = () => {
    const context = useContext(GamesContext);
    if (!context) throw new Error("useGamesContext must be used within a GamesProvider");
    return context;
};

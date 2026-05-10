export const MODULE_ADDRESS = "0x4f1da6c96672d8db3ba87fb56ec9aba88b8eecaa3db2466f360b905d74cbdc4d";

export const CONTRACT_MODULE = "puffer_walks";

// Latest Movement Network endpoints (updated for Mainnet)
export const NETWORK_CONFIG = {
  // Primary mainnet endpoint
  fullnode: "https://mainnet.movementnetwork.xyz/v1",
  // GraphQL indexer endpoint
  indexer: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
  // Network details
  chainId: 126, // Mainnet Chain ID
  // Explorer
  explorer: "https://explorer.movementnetwork.xyz/?network=mainnet",
  // Network status
  status: "https://status.movementnetwork.xyz/",
  // Client configuration
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3
};
export const MODULE_ADDRESS = "0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177";

export const CONTRACT_MODULE = "puffer_walks";

// Latest Movement Network endpoints (updated 2025)
export const NETWORK_CONFIG = {
  // Primary testnet endpoint with timeout settings
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  // GraphQL indexer endpoint
  indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  // Network details
  chainId: 250,
  // Faucet endpoints
  faucet: "https://faucet.testnet.movementinfra.xyz/",
  faucetUI: "https://faucet.movementnetwork.xyz/",
  // Explorer
  explorer: "https://explorer.movementnetwork.xyz/?network=bardock+testnet",
  // Network status
  status: "https://status.movementnetwork.xyz/",
  // Client configuration
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3
};
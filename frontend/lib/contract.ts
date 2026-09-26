import abi from "./abi.json";

// Deterministic on account #0 per HANDOFF.md; override via .env.local if redeployed differently
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi,
} as const;

export const AED_PER_ETH = 20000; // matches backend/config.js
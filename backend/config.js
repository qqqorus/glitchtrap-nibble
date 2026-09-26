// All tunable numbers live here. Override any of them in backend/.env
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const num = (key, fallback) => {
  const v = process.env[key];
  return v === undefined || v === "" ? fallback : Number(v);
};

module.exports = {
  PORT: num("PORT", 3001),

  // Chain
  RPC_URL: process.env.RPC_URL || "http://127.0.0.1:8545",
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  PRIVATE_KEY: process.env.PRIVATE_KEY,

  // Currency: contract baseStake 0.001 ETH = 20 AED  ->  1 ETH = 20,000 AED
  AED_PER_ETH: num("AED_PER_ETH", 20000),
  BASE_STAKE_AED: 20,
  BASE_BENEFIT_AED: 200,
  ATTACK_BENEFIT_AED: 20, // benefit cap while an attack is active

  // Escalation: one signal -> 10x (200 AED), two corroborating signals -> 100x (2,000 AED)
  FIRST_SIGNAL_MULTIPLIER: 10,
  FULL_ATTACK_MULTIPLIER: 100,

  // Detection thresholds
  TEMPORAL_WINDOW_MS: num("TEMPORAL_WINDOW_MS", 60_000),
  TEMPORAL_THRESHOLD: num("TEMPORAL_THRESHOLD", 50), // > N stakes in the window
  FUNDING_THRESHOLD: num("FUNDING_THRESHOLD", 10), // > N wallets sharing one funder

  // Slashing. The contract hard-codes a 30s dispute window, so keep this at 30.
  DISPUTE_SECONDS: 30,
  AUTO_SLASH: process.env.AUTO_SLASH === "true", // false = wait for POST /submit-slash
  AUTO_SLASH_DELAY_MS: num("AUTO_SLASH_DELAY_MS", 4000),
  // Storing 1,000 addresses on-chain in one tx exceeds the gas limit, so only
  // this many go on-chain as evidence. The full list is tracked off-chain.
  MAX_ONCHAIN_FLAGS: num("MAX_ONCHAIN_FLAGS", 200),
};

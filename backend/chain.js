// Connection to the BenefitsPortal contract.
// If the chain is unreachable the backend keeps running in OFFLINE mode:
// detection, the graph and the dashboard all still work, only the on-chain
// calls are skipped. That way a dead Hardhat node never kills the demo.

const { ethers } = require("ethers");
const abi = require("./abi.json");
const cfg = require("./config");

let enabled = false;
let readContract = null; // provider-connected, for events
let ownerContract = null; // signer-connected, for owner-only calls
let signer = null;
let queue = Promise.resolve(); // serialises owner txs so nonces never clash

async function probeChainId(url) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    signal: AbortSignal.timeout(2500),
  });
  const json = await res.json();
  return Number(json.result);
}

async function init() {
  if (!cfg.CONTRACT_ADDRESS || !cfg.PRIVATE_KEY) {
    console.warn("[chain] CONTRACT_ADDRESS or PRIVATE_KEY missing in .env -> OFFLINE mode");
    return false;
  }
  if (!Array.isArray(abi) || abi.length === 0) {
    console.warn("[chain] abi.json is empty -> OFFLINE mode (re-export the ABI from contracts/)");
    return false;
  }

  let chainId;
  try {
    chainId = await probeChainId(cfg.RPC_URL);
  } catch {
    console.warn(`[chain] No node at ${cfg.RPC_URL} -> OFFLINE mode (is 'npx hardhat node' running?)`);
    return false;
  }

  const provider = new ethers.JsonRpcProvider(cfg.RPC_URL, chainId, {
    staticNetwork: true,
    pollingInterval: 500,
  });

  const code = await provider.getCode(cfg.CONTRACT_ADDRESS);
  if (code === "0x") {
    console.warn(
      `[chain] No contract at ${cfg.CONTRACT_ADDRESS} -> OFFLINE mode.\n` +
        "        Hardhat node restarted? Re-run: npx hardhat run scripts/deploy.ts --network localhost"
    );
    return false;
  }

  const wallet = new ethers.Wallet(cfg.PRIVATE_KEY, provider);
  signer = new ethers.NonceManager(wallet);
  readContract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, provider);
  ownerContract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, signer);

  const owner = await readContract.owner();
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.warn(`[chain] WARNING: PRIVATE_KEY is ${wallet.address}, but contract owner is ${owner}. Owner calls will revert.`);
  }

  enabled = true;
  console.log(`[chain] Connected: chainId ${chainId}, contract ${cfg.CONTRACT_ADDRESS}`);
  return true;
}

/**
 * Queue an owner transaction. Never throws: failures are logged and resolve to null,
 * because the demo UI must keep moving even if a tx reverts.
 */
function send(label, build) {
  const p = queue.then(async () => {
    if (!enabled) return null;
    try {
      const tx = await build(ownerContract);
      const receipt = await tx.wait();
      console.log(`[chain] ✓ ${label} (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`);
      return receipt;
    } catch (e) {
      console.error(`[chain] ✗ ${label} failed: ${e.shortMessage || e.message}`);
      signer?.reset(); // resync nonce after a failure
      return null;
    }
  });
  queue = p;
  return p;
}

async function read(fn) {
  if (!enabled) return null;
  try {
    return await fn(readContract);
  } catch (e) {
    console.error(`[chain] read failed: ${e.shortMessage || e.message}`);
    return null;
  }
}

const toAed = (wei) => Math.round(Number(ethers.formatEther(wei)) * cfg.AED_PER_ETH * 100) / 100;

module.exports = {
  init,
  send,
  read,
  toAed,
  isEnabled: () => enabled,
  getReadContract: () => readContract,
};

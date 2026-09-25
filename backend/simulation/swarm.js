// Generates an AI agent swarm: N wallets, all funded by one master wallet,
// each staking and immediately claiming. Used by the CLI script and by
// POST /simulate on the server.

const { ethers } = require("ethers");

// Valid checksummed addresses (so they can go into submitSlashProposal on-chain).
// Much faster than Wallet.createRandom(), which derives a full key per wallet.
const randomAddress = () => ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} o
 * @param {number} o.size        number of wallets
 * @param {number} o.durationMs  spread the swarm over this long
 * @param {(msg: object) => void} o.send  receives SIM_STAKE / SIM_CLAIM messages
 */
async function runSwarm({ size = 1000, durationMs = 5000, send }) {
  const master = randomAddress();
  const start = Date.now();
  let sent = 0;

  // Time-based pacing: Windows timers are ~15ms, so "sleep 5ms per wallet" would take 3x longer.
  while (sent < size) {
    const elapsed = Date.now() - start;
    const target = Math.min(size, Math.ceil((elapsed / durationMs) * size) || 1);
    while (sent < target) {
      const address = randomAddress();
      send({ type: "SIM_STAKE", address, fundingSource: master });
      send({ type: "SIM_CLAIM", address });
      sent++;
    }
    await sleep(20);
  }

  return { master, size, ms: Date.now() - start };
}

module.exports = { runSwarm, randomAddress };

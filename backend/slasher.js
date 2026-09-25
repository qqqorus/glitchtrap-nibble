// Layers 2 and 4 on-chain: stake scaling and the optimistic slash.
// Pure contract calls. The off-chain bookkeeping lives in engine.js.

const cfg = require("./config");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createSlasher(chain) {
  // Explicit gasLimit skips gas estimation. Some nodes estimate against the last
  // mined block's timestamp and wrongly think the dispute window is still open.
  const execute = () => chain.send("executeSlash()", (c) => c.executeSlash({ gasLimit: 8_000_000 }));

  return {
    scaleStake(multiplier) {
      return chain.send(`triggerAttackDetection(${multiplier})`, (c) => c.triggerAttackDetection(multiplier));
    },

    /**
     * Submit the proposal, then execute once the contract's own 30s window
     * (measured from the block the proposal was mined in) has passed.
     * Runs in the background; the dashboard countdown is driven by engine.js.
     */
    async proposeThenExecute(wallets) {
      const evidence = wallets.slice(0, cfg.MAX_ONCHAIN_FLAGS);
      const receipt = await chain.send(`submitSlashProposal(${evidence.length} of ${wallets.length} wallets)`, (c) =>
        c.submitSlashProposal(evidence)
      );
      if (!receipt) return null;

      await sleep((cfg.DISPUTE_SECONDS + 2) * 1000);
      return (await execute()) || (await sleep(3000), await execute());
    },
  };
}

module.exports = { createSlasher };

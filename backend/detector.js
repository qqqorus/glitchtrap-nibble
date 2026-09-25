// Layer 3: behavioural graph analysis.
// Two signals, each fires once per attack:
//   TEMPORAL_CLUSTERING - too many stakes inside a sliding time window
//   COMMON_FUNDING      - too many wallets funded by the same source (star pattern)
//
// Design choice: temporal clustering only raises the stake (reversible).
// Only wallets inside a common-funding cluster get flagged for slashing
// (irreversible), so an honest user who happens to stake during a busy
// minute is never slashed.

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "?");

class Detector {
  constructor({ windowMs, temporalThreshold, fundingThreshold }) {
    this.windowMs = windowMs;
    this.temporalThreshold = temporalThreshold;
    this.fundingThreshold = fundingThreshold;
    this.reset();
  }

  reset() {
    this.window = []; // timestamps of recent stakes, oldest first
    this.byFunder = new Map(); // funder -> Set(wallets)
    this.temporalFired = false;
    this.flaggedFunders = new Set();
  }

  /** Record one stake. Returns an array of newly fired signals (usually empty). */
  record({ address, fundingSource, timestamp = Date.now() }) {
    const signals = [];

    this.window.push(timestamp);
    while (this.window.length && timestamp - this.window[0] > this.windowMs) {
      this.window.shift();
    }

    if (fundingSource) {
      if (!this.byFunder.has(fundingSource)) this.byFunder.set(fundingSource, new Set());
      const cluster = this.byFunder.get(fundingSource);
      cluster.add(address);

      if (cluster.size > this.fundingThreshold && !this.flaggedFunders.has(fundingSource)) {
        this.flaggedFunders.add(fundingSource);
        signals.push({
          kind: "COMMON_FUNDING",
          funder: fundingSource,
          reason: `COMMON FUNDING SOURCE DETECTED: ${cluster.size} wallets funded by ${short(fundingSource)}`,
        });
      }
    }

    if (!this.temporalFired && this.window.length > this.temporalThreshold) {
      this.temporalFired = true;
      signals.push({
        kind: "TEMPORAL_CLUSTERING",
        reason: `TEMPORAL CLUSTERING DETECTED: ${this.window.length} stakes in ${this.windowMs / 1000}s`,
      });
    }

    return signals;
  }

  isFlagged(fundingSource) {
    return !!fundingSource && this.flaggedFunders.has(fundingSource);
  }

  /** Every wallet belonging to a flagged funding cluster. */
  flaggedWallets() {
    const out = [];
    for (const funder of this.flaggedFunders) out.push(...this.byFunder.get(funder));
    return out;
  }
}

module.exports = { Detector, short };

// The brain: holds demo state, runs detection on every stake, escalates the
// defence, runs the slash countdown, and broadcasts WsMessage events that
// match frontend/lib/types.ts exactly.

const cfg = require("./config");

class Engine {
  constructor({ detector, slasher, broadcast }) {
    this.detector = detector;
    this.slasher = slasher;
    this.broadcast = broadcast;
    this.timers = new Set();
    this.reset();
  }

  // ---------- state ----------

  reset() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    clearTimeout(this.capitalTimer);
    this.capitalTimer = null;
    this.detector.reset();
    this.status = "NORMAL";
    this.multiplier = 1;
    this.attackActive = false;
    this.signals = []; // fired signal reasons
    this.wallets = new Map(); // address(lowercase) -> wallet record
    this.slash = { phase: "idle" }; // idle | pending | executed
    this.lastCapitalSent = -1;
  }

  get requiredStake() {
    return cfg.BASE_STAKE_AED * this.multiplier;
  }

  get benefitAmount() {
    return this.attackActive ? cfg.ATTACK_BENEFIT_AED : cfg.BASE_BENEFIT_AED;
  }

  flagged() {
    return [...this.wallets.values()].filter((w) => w.flagged);
  }

  attackerCapital() {
    return this.flagged().reduce((s, w) => s + w.stake, 0);
  }

  later(ms, fn) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.broadcast({ type: "STATUS_UPDATE", status });
    console.log(`[engine] STATUS -> ${status}`);
  }

  // Throttled so 1,000 stakes don't send 1,000 counter updates
  sendCapital() {
    if (this.capitalTimer) return;
    this.capitalTimer = setTimeout(() => {
      this.capitalTimer = null;
      const amount = this.attackerCapital();
      if (amount !== this.lastCapitalSent) {
        this.lastCapitalSent = amount;
        this.broadcast({ type: "CAPITAL_LOCKED", amount });
      }
    }, 150);
  }

  /** Sent to every newly connected client so a refreshed page is in sync. */
  initialMessages() {
    return [
      { type: "STATUS_UPDATE", status: this.status },
      { type: "STAKE_REQUIREMENT_UPDATED", requiredStake: this.requiredStake, multiplier: this.multiplier },
      { type: "CAPITAL_LOCKED", amount: this.attackerCapital() },
    ];
  }

  snapshot() {
    const flagged = this.flagged();
    return {
      status: this.status,
      multiplier: this.multiplier,
      requiredStake: this.requiredStake,
      benefitAmount: this.benefitAmount,
      signals: this.signals,
      wallets: this.wallets.size,
      realWallets: [...this.wallets.values()].filter((w) => w.isReal).length,
      flaggedWallets: flagged.length,
      attackerCapital: this.attackerCapital(),
      attackerBenefits: flagged.reduce((s, w) => s + w.benefit, 0),
      slash: this.slash,
    };
  }

  // ---------- stakes & claims ----------

  handleStake({ address, fundingSource, isReal = false, amountAed }) {
    const key = address.toLowerCase();
    if (this.wallets.has(key)) return;

    // A simulated wallet must pay whatever the requirement is at that moment.
    // Real wallets report what they actually paid on-chain.
    const stake = isReal ? amountAed : this.requiredStake;
    const timestamp = Date.now();
    const wallet = { address, fundingSource, isReal, stake, benefit: 0, flagged: false, slashed: false };
    this.wallets.set(key, wallet);

    const signals = this.detector.record({ address, fundingSource, timestamp });
    wallet.flagged = this.detector.isFlagged(fundingSource);

    this.broadcast({
      type: "STAKE_LOCKED",
      address,
      amount: stake,
      fundingSource,
      isReal,
      flagged: wallet.flagged, // extra field: lets the graph colour late arrivals red
      timestamp,
    });

    for (const s of signals) this.onSignal(s);
    this.sendCapital();
  }

  handleClaim(address, amountAed) {
    const w = this.wallets.get(address.toLowerCase());
    if (!w || w.benefit > 0) return;
    w.benefit = amountAed ?? this.benefitAmount;
    this.broadcast({ type: "BENEFIT_CLAIMED", address: w.address, amount: w.benefit, isReal: w.isReal, timestamp: Date.now() });
  }

  onRealStake(address, amountAed) {
    this.handleStake({ address, isReal: true, amountAed });
  }

  onRealClaim(address, amountAed) {
    if (!this.wallets.has(address.toLowerCase())) this.onRealStake(address, cfg.BASE_STAKE_AED);
    this.handleClaim(address, amountAed);
  }

  onRealWithdraw(address) {
    this.broadcast({ type: "STAKE_RETURNED", address, timestamp: Date.now() });
  }

  // ---------- defence ----------

  onSignal(signal) {
    this.signals.push(signal.reason);
    const firstSignal = !this.attackActive;
    this.attackActive = true;

    // Retro-flag every wallet in the cluster, including the ones that staked before detection
    for (const addr of this.detector.flaggedWallets()) {
      const w = this.wallets.get(addr.toLowerCase());
      if (w) w.flagged = true;
    }

    const target = this.signals.length >= 2 ? cfg.FULL_ATTACK_MULTIPLIER : cfg.FIRST_SIGNAL_MULTIPLIER;

    console.log(`[engine] 🚨 ${signal.reason}`);
    this.broadcast({
      type: "ATTACK_DETECTED",
      reason: signal.reason,
      wallets: this.detector.flaggedWallets(),
      multiplier: target,
      timestamp: Date.now(),
    });

    if (firstSignal) this.setStatus("UNDER_ATTACK");
    this.setMultiplier(target);

    if (target === cfg.FULL_ATTACK_MULTIPLIER) {
      // Short pause so "UNDER ATTACK" is visible before "DEFENDED"
      this.later(1500, () => {
        if (this.status === "UNDER_ATTACK") this.setStatus("DEFENDED");
      });
      if (cfg.AUTO_SLASH) this.later(cfg.AUTO_SLASH_DELAY_MS, () => this.submitSlash());
    }
  }

  setMultiplier(m) {
    if (m <= this.multiplier) return;
    console.log(`[engine] 🛡️  stake scaling ${this.multiplier}x -> ${m}x (${cfg.BASE_STAKE_AED * m} AED)`);
    this.multiplier = m;
    this.broadcast({ type: "STAKE_REQUIREMENT_UPDATED", requiredStake: this.requiredStake, multiplier: m });
    this.slasher.scaleStake(m);
  }

  submitSlash() {
    if (this.slash.phase !== "idle") return { ok: false, error: `Slash already ${this.slash.phase}` };

    const targets = this.flagged().filter((w) => !w.slashed);
    if (targets.length === 0) return { ok: false, error: "No flagged wallets to slash" };

    const wallets = targets.map((w) => w.address);
    const reason = this.signals.length
      ? this.signals.map((r) => r.split(":")[0].replace(" DETECTED", "")).join(" + ")
      : "Sybil cluster";
    const disputeSeconds = cfg.DISPUTE_SECONDS;
    const deadline = Date.now() + disputeSeconds * 1000;

    this.slash = { phase: "pending", wallets: wallets.length, reason, deadline };
    this.broadcast({ type: "SLASH_PROPOSAL", wallets, reason, disputeSeconds });
    console.log(`[engine] ⚖️  slash proposed: ${wallets.length} wallets, ${disputeSeconds}s dispute window`);

    this.slasher.proposeThenExecute(wallets); // on-chain, in the background
    this.later(disputeSeconds * 1000, () => this.executeSlash(targets)); // dashboard

    return { ok: true, wallets: wallets.length, disputeSeconds, deadline };
  }

  executeSlash(targets) {
    const capital = targets.reduce((s, w) => s + w.stake, 0);
    const benefits = targets.reduce((s, w) => s + w.benefit, 0);
    const burned = Math.floor(capital / 2);
    const treasury = capital - burned;
    const attackerLoss = capital - benefits;

    for (const w of targets) w.slashed = true;
    this.slash = { phase: "executed", wallets: targets.length, burned, treasury, attackerLoss };

    this.broadcast({ type: "SLASH_EXECUTED", burned, treasury, attackerLoss });
    this.setStatus("SLASHED");
    console.log(
      `[engine] ⚡ SLASH EXECUTED: capital ${capital} AED, burned ${burned}, treasury ${treasury}, attacker net loss ${attackerLoss}`
    );
  }

  /** Back to a clean demo state (on-chain stakes like Sarah's stay locked). */
  fullReset() {
    this.reset();
    this.broadcast({ type: "RESET" });
    for (const m of this.initialMessages()) this.broadcast(m);
    this.slasher.scaleStake(1);
    console.log("[engine] reset");
  }
}

module.exports = { Engine };

// Forwards real on-chain activity (Sarah's MetaMask transactions) into the engine.

function startListener(chain, engine) {
  const c = chain.getReadContract();
  if (!c) {
    console.log("[listener] chain offline, not listening for on-chain events");
    return;
  }

  c.on("StakeLocked", (user, amount) => {
    console.log(`[listener] StakeLocked ${user}`);
    engine.onRealStake(user, chain.toAed(amount));
  });

  c.on("BenefitClaimed", (user, benefit) => {
    console.log(`[listener] BenefitClaimed ${user}`);
    engine.onRealClaim(user, chain.toAed(benefit));
  });

  c.on("StakeWithdrawn", (user, amount) => {
    console.log(`[listener] StakeWithdrawn ${user}`);
    engine.onRealWithdraw(user, chain.toAed(amount));
  });

  console.log("[listener] listening for StakeLocked / BenefitClaimed / StakeWithdrawn");
}

module.exports = { startListener };

# Backend: Detection, Defence & Slashing

Express + WebSocket server on **:3001**. It watches every stake, detects swarms, escalates the required stake, runs the slash, and pushes live events to the frontend.

## Run

```powershell
# Terminal 1 (contracts/):  npx hardhat node
# Terminal 2 (contracts/):  npx hardhat run scripts/deploy.ts --network localhost
# Terminal 3 (backend/):
npm install
copy .env.example .env      # first time only
npm start
# Terminal 4 (backend/), during the demo:
npm run swarm -- 1000
```

If the Hardhat node isn't running, the backend starts in **OFFLINE mode**. The dashboard, graph and slash all still work; only the on-chain calls are skipped.

After restarting `hardhat node`, re-run the deploy, then restart the backend.

## How detection works

| Signal | Fires when | Effect |
|---|---|---|
| Common funding source | > 10 wallets funded by the same wallet | Stake 20 → **200 AED** (10x), status `UNDER_ATTACK`, benefit cap 200 → 20 AED, cluster flagged |
| Temporal clustering | > 50 stakes within 60s | Stake → **2,000 AED** (100x), status `DEFENDED` |

Only wallets in a common-funding cluster are flagged for slashing. Temporal clustering raises the stake but never slashes anyone, so a real user who stakes during a busy minute is safe.

Each simulated wallet pays the stake required *at the moment it stakes*, so the totals are real sums, not hard-coded. A typical 1,000-wallet run: ~1,906,000 AED locked, ~21,800 AED claimed, ~953,000 burned + ~953,000 to treasury, **~-1,884,000 AED attacker net loss**.

## HTTP

| Method | Path | Body | What it does |
|---|---|---|---|
| GET | `/health` | | `{ ok, chain }` |
| GET | `/state` | | Full snapshot, handy for debugging |
| POST | `/submit-slash` | | Proposes the slash, 30s dispute countdown, then executes. 409 if already pending or nothing flagged |
| POST | `/simulate` | `{ size?, durationMs? }` | Runs the swarm from the UI (same as the CLI script) |
| POST | `/reset` | | Clean demo state, contract stake back to 1x |

## WebSocket: server → frontend

All messages match `WsMessage` in `frontend/lib/types.ts`. Amounts are **AED numbers**.

| type | fields | when |
|---|---|---|
| `STATUS_UPDATE` | `status` | NORMAL → UNDER_ATTACK → DEFENDED → SLASHED |
| `STAKE_LOCKED` | `address, amount, fundingSource?, isReal, flagged, timestamp` | every stake (real = Sarah via MetaMask) |
| `BENEFIT_CLAIMED` | `address, amount, isReal, timestamp` | every claim |
| `STAKE_RETURNED` | `address, timestamp` | Sarah withdraws |
| `ATTACK_DETECTED` | `reason, wallets[], multiplier, timestamp` | once per signal (twice per attack) |
| `STAKE_REQUIREMENT_UPDATED` | `requiredStake, multiplier` | 20 → 200 → 2000 |
| `CAPITAL_LOCKED` | `amount` | attacker capital counter, throttled ~150ms |
| `SLASH_PROPOSAL` | `wallets[], reason, disputeSeconds` | start the countdown modal |
| `SLASH_EXECUTED` | `burned, treasury, attackerLoss` | countdown hits zero |
| `RESET` | | after POST /reset |

Two extra fields not yet in `types.ts`: `flagged` on `STAKE_LOCKED` (colour late swarm nodes red straight away) and `isReal` on `BENEFIT_CLAIMED` (so the alert feed can skip 1,000 bot claims).

On connect, the server immediately sends `STATUS_UPDATE`, `STAKE_REQUIREMENT_UPDATED` and `CAPITAL_LOCKED`, so a refreshed page is in sync.

## Files

| File | Role |
|---|---|
| `server.js` | HTTP routes, WebSocket, startup |
| `engine.js` | Demo state, escalation, slash countdown, all broadcasts |
| `detector.js` | The two detection signals |
| `chain.js` | Contract connection, serialised owner transactions, OFFLINE fallback |
| `listener.js` | Forwards Sarah's on-chain events |
| `slasher.js` | `triggerAttackDetection`, `submitSlashProposal`, `executeSlash` |
| `simulation/swarm.js` | Swarm generator (valid random addresses, one master funder) |
| `simulation/simulate-swarm.js` | CLI: `npm run swarm -- 1000` |
| `config.js` | Every threshold and number, overridable in `.env` |

Only the first 200 flagged addresses go on-chain in `submitSlashProposal`. Storing 1,000 in one transaction goes over the gas limit. The full list is tracked off-chain.

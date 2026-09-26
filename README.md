# 🎯 GlitchTrap

> **We don't detect bots. We bankrupt them.**

An agent-resistant government benefits portal that uses crypto-economics to make Sybil attacks financially suicidal.

**Track:** Web Dev + Blockchain
**Hackathon:** Bit n Build '26
**Team:** Quishia ([@qqqorus](https://github.com/qqqorus)) · Luna ([@theLunaverse](https://github.com/theLunaverse)) · Ayah ([@Ayah-web](https://github.com/Ayah-web))

---

## The Problem

A network's rules assume each participant is a separate someone with something to lose. AI agent swarms make acting as 10,000 people cost almost nothing, and they look like 10,000 ordinary people.

Government benefits programs (stimulus checks, subsidies, voting) are directly vulnerable: a swarm can drain public funds by claiming thousands of times at once.

Traditional defenses (CAPTCHAs, biometrics, "prove you're human" checks) are **banned by the organizers** and easily bypassed by advanced AI anyway.

## The GlitchTrap Solution

We **don't try to detect bots**. We assume everyone could be a bot and use **crypto-economics** to make being one financially suicidal.

| Layer | Mechanism |
|---|---|
| **1. Proof of Stake** | Every claimant locks their own capital (20 AED) for 30 days |
| **2. Dynamic Stake Scaling** | The stake rises automatically under attack: 20 → 200 → 2,000 AED |
| **3. Behavioral Graph Analysis** | Swarms are detected by collective patterns across wallets, not by inspecting individuals |
| **4. The Slash Condition** | Flagged attackers lose 100% of their locked capital: half burned, half to a public treasury |

**The result (live 1,000-wallet run):** the attacker locks ~1.9 million AED, receives ~21,800 AED in benefits, then loses all of it. **Net loss: ~1.88 million AED.** Sarah, the real user, gets her 200 AED benefit and her stake back.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Browser — localhost:3000                       │
│  ┌──────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ User Portal  │  │  Live Network Graph   │  │ Defense        │ │
│  │ Lock / Claim │  │  green = real user    │  │ Dashboard      │ │
│  │ / Withdraw   │  │  red = flagged swarm  │  │ status, stake, │ │
│  │              │  │  star = common funder │  │ alerts, slash  │ │
│  └──────┬───────┘  └───────────▲───────────┘  └───────▲────────┘ │
└─────────┼──────────────────────┼──────────────────────┼──────────┘
          │ MetaMask (wagmi)     │ WebSocket :3001      │ POST /simulate
          │                      │                      │ /submit-slash
          ▼                      │                      │ /reset
┌─────────────────────┐   ┌──────┴──────────────────────┴──────────┐
│  Smart Contract     │◄──┤  Backend (Node, Express, ws)           │
│  BenefitsPortal.sol │   │  detector → engine → slasher           │
│  Hardhat node :8545 ├──►│  listens to StakeLocked / Claimed /    │
│                     │   │  Withdrawn, sends owner txs            │
└─────────────────────┘   └──────────────────▲─────────────────────┘
                                             │ SIM_STAKE / SIM_CLAIM
                                     ┌───────┴────────┐
                                     │ Swarm simulator│
                                     │ npm run swarm  │
                                     └────────────────┘
```

- **Sarah** talks to the contract directly through MetaMask. The backend sees her transactions via contract events.
- **The swarm** is simulated off-chain (1,000 wallets in ~5 seconds) and fed to the backend, which runs detection exactly as it would for on-chain events.
- **The backend** is the contract owner. It raises the stake and submits and executes slashes on-chain, and pushes every event to the dashboard over WebSocket.

---

## Repository Structure

```
glitchtrap-nibble/
├── README.md
├── docs/
│   └── HANDOFF.md                      # Contract address, test keys, integration notes
│
├── contracts/                          # Solidity + Hardhat 3
│   ├── contracts/BenefitsPortal.sol    # Stake, claim, withdraw, stake scaling, slashing
│   ├── scripts/deploy.ts               # Deploys and funds the contract
│   ├── test/BenefitsPortal.test.ts     # 5 contract tests
│   ├── types/ethers-contracts/         # Generated TypeScript contract types
│   ├── abi.json                        # Exported ABI
│   └── hardhat.config.ts
│
├── backend/                            # Detection, defense and slashing
│   ├── server.js                       # HTTP routes + WebSocket server on :3001
│   ├── engine.js                       # Demo state, escalation, slash countdown, broadcasts
│   ├── detector.js                     # Common-funding + temporal-clustering signals
│   ├── chain.js                        # Contract connection, owner txs, offline fallback
│   ├── listener.js                     # Forwards Sarah's on-chain events
│   ├── slasher.js                      # triggerAttackDetection / submitSlashProposal / executeSlash
│   ├── config.js                       # All thresholds and numbers
│   ├── simulation/
│   │   ├── swarm.js                    # Swarm generator (1 master wallet → N wallets)
│   │   └── simulate-swarm.js           # CLI: npm run swarm -- 1000
│   ├── .env.example
│   └── README.md                       # WebSocket message + endpoint reference
│
└── frontend/                           # Next.js dashboard
    ├── app/
    │   ├── page.tsx                    # 3-panel dashboard + WebSocket message router
    │   ├── layout.tsx, providers.tsx   # Fonts, wagmi + React Query providers
    │   └── globals.css
    ├── components/
    │   ├── portal/UserPortalPanel.tsx  # Wallet, lock / claim / withdraw
    │   ├── graph/NetworkGraph.tsx      # Live network graph (+ GtNode.tsx)
    │   └── dashboard/                  # DefenseStats, ActivitySpike, AlertFeed
    ├── hooks/
    │   ├── useBackendSocket.ts         # Single shared WebSocket connection
    │   └── useChainGuard.ts            # Wrong-network check
    ├── stores/                         # Zustand: defense, graph, portal
    └── lib/                            # wagmi config, contract config, ABI, WsMessage types
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity 0.8.34, Hardhat 3 (mocha + ethers toolbox) |
| Blockchain | Local Hardhat network (chain ID 31337) |
| Backend | Node.js, Express 5, `ws`, ethers v6 |
| Frontend | Next.js 16 (App Router), React 19, wagmi 3, viem |
| Wallet | MetaMask (wagmi injected connector) |
| Graph | React Flow (`@xyflow/react`) |
| State | Zustand |
| Styling | Tailwind CSS 4, Framer Motion |

---

## How It Works

### Layer 1: Proof of Stake
To claim a benefit, a wallet locks **20 AED** of its own ETH in the contract (0.001 ETH; 1 ETH = 20,000 AED in the demo).

- **A real citizen:** locks 20 AED, claims 200 AED, gets the 20 AED back after the lock period. Net: +200 AED.
- **An AI swarm of 1,000 wallets:** must lock its own capital for every wallet. That is the first cost of attacking.

### Layer 2: Dynamic Stake Scaling
The required stake is not fixed. It escalates with the evidence:

| Evidence | Stake | Benefit per claim |
|---|---|---|
| Normal | 20 AED (1x) | 200 AED |
| One swarm signal | 200 AED (10x) | capped at 20 AED |
| Two corroborating signals | 2,000 AED (100x) | capped at 20 AED |

The backend calls `triggerAttackDetection()` on the contract, so the new stake is enforced on-chain for everyone, instantly. The system doesn't block attackers. It prices them out in real time.

### Layer 3: Behavioral Graph Analysis
Swarms are identified by patterns across wallets:

- **Common funding source:** more than 10 wallets funded by the same master wallet (the "star" on the graph).
- **Temporal clustering:** more than 50 stakes within 60 seconds.

Only the funding-source signal flags wallets for slashing. Temporal clustering raises the stake but never slashes anyone, so a real user who happens to stake during a busy minute is never punished.

### Layer 4: The Slash Condition
Flagged wallets are slashed through an **optimistic oracle model**:

1. The backend submits a slash proposal on-chain.
2. A dispute window opens: 48 hours in production, **30 seconds in the demo**.
3. With no dispute, `executeSlash()` runs: **50% burned, 50% to the public treasury.**

No human decides. The attacker's loss is 100% of their capital, not just opportunity cost.

---

## Demo Numbers

Numbers are calculated live from each run, not hard-coded. A typical 1,000-wallet attack:

| Metric | Value |
|---|---|
| Attacker wallets spawned | 1,000 |
| Attacker capital locked | ~1,906,000 AED |
| Attacker benefits received | ~21,800 AED |
| Burned | ~953,000 AED |
| Sent to public treasury | ~953,000 AED |
| **Attacker net loss** | **~-1,884,000 AED** |
| Sarah (real user) | +200 AED, stake returned |

The first ~50 wallets get in at the lower stake before detection fires. That is why the total is just under 2,000,000 AED.

---

## Quick Start

### Prerequisites
- Node.js **22.13+** (required by Hardhat 3)
- MetaMask browser extension (Chrome, Edge or Brave)

### 1. Clone and install
```bash
git clone https://github.com/qqqorus/glitchtrap-nibble.git
cd glitchtrap-nibble

cd contracts && npm install --allow-git=all && cd ..
cd backend   && npm install && cd ..
cd frontend  && npm install && cd ..
```
`--allow-git=all` is needed on npm 11+ because Hardhat's template pulls `forge-std` from GitHub.

### 2. Configure the backend
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```
The defaults point at the local Hardhat node and its public test account #0. They are test keys only; never use them with real funds.

### 3. Run it (4 terminals)

| # | Folder | Command | Expect |
|---|---|---|---|
| 1 | `contracts/` | `npx hardhat node` | `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/` (keep running) |
| 2 | `contracts/` | `npx hardhat run scripts/deploy.ts --network localhost` | `✅ BenefitsPortal deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| 3 | `backend/` | `npm start` | `chain: ONLINE` (keep running) |
| 4 | `frontend/` | `npm run dev` | open http://localhost:3000 (keep running) |

After restarting the Hardhat node, redeploy (terminal 2) and restart the backend (terminal 3). The contract address is deterministic, so it stays the same.

### 4. Configure MetaMask
1. Add a custom network: **RPC** `http://127.0.0.1:8545`, **Chain ID** `31337`, **Currency** ETH.
2. Import Hardhat **account #1** as "Sarah" (key in `docs/HANDOFF.md`). Don't use account #0, because the backend sends owner transactions from it.
3. After every Hardhat node restart: MetaMask → Settings → Advanced → **Clear activity tab data**.

---

## Running the Demo

1. **Sarah:** Connect Wallet → Lock Stake (20 AED) → Claim Benefit (200 AED). A green node appears.
2. **Attack:** click **Launch swarm (live)** on the Defense Dashboard, or run `npm run swarm -- 1000` in `backend/`.
3. **Detection:** 1,000 wallets flood the graph as a star around one master wallet. Status goes **NORMAL → UNDER ATTACK → DEFENDED** and the stake climbs 20 → 200 → 2,000 AED.
4. **Slash:** click **⚡ Submit slash proposal**. A 30-second dispute countdown runs, then **SLASH EXECUTED** shows the burned amount, the treasury amount and the attacker's net loss.
5. **Sarah withdraws:** the stake is locked for "30 days" (compressed to 1 second per day in the demo). Once it unlocks, she withdraws her 20 AED. Real users are unaffected.
6. **Reset:** click **Reset (live)** to run it again.

---

## Testing

### Smart contract
```bash
cd contracts
npx hardhat test
```
5 tests:
- Sarah can lock stake, claim benefit, and withdraw
- Owner can scale stake to 100x
- Slash can only execute after the dispute window
- Slashed wallet cannot withdraw
- Same address can lock again after a full cycle

### Backend (end to end)
With the Hardhat node, the deploy and the backend running:
```bash
cd backend
npm run swarm -- 1000
```
The backend log should show both detection signals, `✓ triggerAttackDetection(10)` and `(100)`, and after `POST /submit-slash`, `✓ submitSlashProposal` then `✓ executeSlash()`. `GET http://localhost:3001/state` returns the full demo state.

---

## Design Decisions

**Why not detect bots directly?** CAPTCHAs and biometrics are banned and trivially bypassed by advanced AI. We don't check *who* is behind a wallet. We check *whether the economics make sense*.

**Why proof of stake?** It converts the cost of attacking from near zero (spawn a wallet) to substantial (lock real capital). The attacker's own money becomes the defense.

**Why escalate in steps?** Each signal raises the stake proportionally to the evidence. One signal might be a coincidence, and two corroborating signals is a swarm. That keeps false positives cheap for real users.

**Why only slash on common funding?** Slashing is irreversible, so it requires the stronger, wallet-specific evidence. Temporal clustering alone only raises the price.

**Why slashing at all?** Without it, an attacker loses only opportunity cost. With it, they lose 100% of capital. The attack goes from expensive to existential.

**Why local Hardhat?** Zero cost, instant finality, deterministic addresses and no faucet friction. The contract is portable to any EVM chain.

**Why an offline fallback?** If the chain goes down mid-demo, the backend keeps detection, the graph and the dashboard running and only skips the on-chain calls.

---

## Known Limitations (Demo MVP)

1. **The swarm is simulated off-chain.** The 1,000 attacker wallets never send real transactions. The backend processes them exactly like on-chain stakes, but the attacker capital, benefits and slash totals are computed by the backend, not read from the contract.
2. **The on-chain slash is partial.** Only the first 200 flagged addresses go into `submitSlashProposal` (1,000 in one transaction exceeds the gas limit). `executeSlash()` burns 50% to `0x…dEaD`; the treasury half stays in the contract, since there's no separate treasury contract yet.
3. **Detection is off-chain and owner-triggered.** The backend runs the graph analysis and calls owner functions. Production would use a decentralized oracle, with the dispute window enforced by bonded disputers.
4. **The lock period is 30 seconds, shown as 30 days.** This lets the demo show a full stake → claim → withdraw cycle.
5. **Benefits are fixed at 0.01 ETH.** Production would use a stablecoin, or pay out in fiat through the existing benefits system.

---

## Roadmap

- [ ] Treasury contract that receives the non-burned half of slashed stakes
- [ ] Batched slashing for 10,000+ wallets
- [ ] Real on-chain swarm test (thousands of funded wallets on a testnet)
- [ ] More signals: wallet age, transaction history, behavioral uniformity
- [ ] On-chain optimistic oracle with bonded disputes
- [ ] Deploy to Sepolia
- [ ] Multiple benefit types (one-time, recurring, conditional)

---

## Team

| Role | Name | GitHub |
|---|---|---|
| Blockchain | Quishia | [@qqqorus](https://github.com/qqqorus) |
| Backend | Luna | [@theLunaverse](https://github.com/theLunaverse) |
| Frontend | Ayah | [@Ayah-web](https://github.com/Ayah-web) |

---

## Acknowledgments

Built during **Bit n Build '26** for the **Sybil Resistance Under Agent Swarms** problem statement.

---

> **GlitchTrap doesn't just make attacks expensive. It makes them financially suicidal.**

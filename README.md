# GlitchTrap — Agent-Resistant Benefits Portal

> We don't detect bots. We bankrupt them.

## Project Status

| Layer | Owner | Status |
|---|---|---|
| Smart Contract | Quishia (Person A) | ✅ Complete, 4/4 tests passing, deployed locally |
| Backend / Detection | Luna (Person B) | ✅ Complete, tested end to end against the contract |
| Frontend / UI | Ayah (Person C) | 🟡 UI built with mocked data, WebSocket + wallet integration pending |

## Blockchain (Quishia)
- ✅ `BenefitsPortal.sol` written, 4/4 tests passing (`npx hardhat test`)
- ✅ Deployed to local Hardhat node at `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- ✅ ABI exported to `backend/abi.json`
- ⏳ `frontend/lib/abi.json` still empty, re-export needed

## Backend (Luna)
- ✅ Express + WebSocket server on `:3001`
- ✅ Detection: common funding source (>10 wallets, one funder) + temporal clustering (>50 stakes in 60s)
- ✅ Dynamic stake scaling on-chain: 20 → 200 → 2,000 AED
- ✅ Slash flow on-chain: proposal → 30s dispute window → execute
- ✅ Swarm simulator: `npm run swarm -- 1000`
- ✅ Listens to Sarah's real on-chain stake / claim / withdraw
- ✅ Offline fallback: the demo still runs if the Hardhat node is down
- See `backend/README.md` for every WebSocket message and endpoint

## Frontend (Ayah)
- ✅ Landing page, User Portal panel, Zustand stores, message types
- ⏳ Connect to `ws://localhost:3001` and replace the `setTimeout` mocks in `stores/defense.ts`
- ⏳ Wire buttons to `POST /simulate`, `/submit-slash`, `/reset`
- ⏳ Real wallet flow with wagmi (Hardhat chain 31337, Sarah = account #1)

## How to Run

| Terminal | Folder | Command | Keep running? |
|---|---|---|---|
| 1 | `contracts/` | `npx hardhat node` | Yes |
| 2 | `contracts/` | `npx hardhat run scripts/deploy.ts --network localhost` | No (re-run after every node restart) |
| 3 | `backend/` | `npm start` | Yes |
| 4 | `frontend/` | `npm run dev` → http://localhost:3000 | Yes |
| 5 | `backend/` | `npm run swarm -- 1000` (during the demo) | No |

First time only: `npm install` in each folder (in `contracts/` use `npm install --allow-git=all`) and create `backend/.env` from `backend/.env.example`.

## Demo Numbers (1,000-wallet run)
Numbers are calculated live, not hard-coded. Typical run:

| Metric | Value |
|---|---|
| Attacker capital locked | ~1,906,000 AED |
| Attacker benefits received | ~21,800 AED |
| Burned | ~953,000 AED |
| Sent to public treasury | ~953,000 AED |
| **Attacker net loss** | **~-1,884,000 AED** |
| Sarah | +200 AED, stake returned |

See `docs/HANDOFF.md` for contract details and keys.
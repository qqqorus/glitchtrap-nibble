\# GlitchTrap — Person A Handoff



\*\*Status:\*\* Contract complete, tested, deployable. Ready for backend and frontend integration.



\## Contract Address (Local)

0x5FbDB2315678afecb367f032d93F642f64180aa3



This address is \*\*deterministic\*\* — it will be the same every time you restart

the local node and redeploy with account #0.



\## Network Details

\- RPC URL: http://127.0.0.1:8545

\- Chain ID: 31337

\- Currency: ETH (test, fake money)



\## Owner Private Key (Account #0)

0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80



Use this in the backend `.env` for owner-only calls:

\- `triggerAttackDetection(uint256)`

\- `submitSlashProposal(address\[])`

\- `executeSlash()`



\*\*Testnet only. Never use this for real funds.\*\*



\## Other Pre-Funded Accounts (from `npx hardhat node`)

Paste account #1's private key here for Person C to use in MetaMask

as "Sarah" (the real user for the demo).



Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d



\## How to Start Everything Tomorrow



Terminal 1:

&#x20;   cd contracts

&#x20;   npx hardhat node



Terminal 2:

&#x20;   cd contracts

&#x20;   npx hardhat run scripts/deploy.ts --network localhost



Both must stay running for the frontend and backend to work.



\## Contract Functions



Public (anyone can call):

\- `lockStake()` — payable. Locks `getCurrentStake()` ETH.

\- `claimBenefit()` — sends 0.01 ETH to the caller.

\- `withdrawStake()` — returns locked stake after 60s lock.

\- `getCurrentStake()` — view. Returns current required stake.



Owner-only (backend uses these):

\- `triggerAttackDetection(uint256 newMultiplier)` — scales stake.

\- `submitSlashProposal(address\[] wallets)` — flags wallets.

\- `executeSlash()` — burns/redistributes. Callable 30s after proposal.



\## Contract Events

\- `StakeLocked(address user, uint256 amount)`

\- `BenefitClaimed(address user, uint256 benefit)`

\- `StakeWithdrawn(address user, uint256 amount)`

\- `AttackDetected(uint256 newMultiplier)`

\- `SlashProposed(uint256 walletCount, uint256 timestamp)`

\- `SlashExecuted(uint256 burned, uint256 treasury)`



\## ABI

\- `frontend/lib/abi.json`

\- `backend/abi.json`



\## Notes for Person B (Backend)

\- Connect with `ethers.JsonRpcProvider("http://127.0.0.1:8545")`.

\- Use account #0's private key for owner calls.

\- Listen to `StakeLocked` event to trigger detection logic.

\- `triggerAttackDetection(100)` scales stake from 20 AED → 2,000 AED.



\## Notes for Person C (Frontend)

\- Import the ABI from `@/lib/abi.json`.

\- Contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

\- Use wagmi's `useReadContract` for `getCurrentStake()`.

\- Use `useWriteContract` for `lockStake`, `claimBenefit`, `withdrawStake`.

\- Add a custom chain in wagmi config:

&#x20;   {

&#x20;     id: 31337,

&#x20;     name: "Hardhat Local",

&#x20;     nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },

&#x20;     rpcUrls: { default: { http: \["http://127.0.0.1:8545"] } },

&#x20;   }


import { create } from "zustand";
import type { Alert, AlertKind, SystemStatus } from "@/lib/types";
import { useGraphStore } from "./graph";
import { usePortalStore } from "./portal";

type DefenseState = {
  status: SystemStatus;
  multiplier: number;
  requiredStake: number;
  attackerCapital: number;
  attackerBenefits: number;
  attackerLoss: number;
  treasuryGain: number;
  burned: number;

  alerts: Alert[];
  slashProposal?: { wallets: number; disputeSeconds: number; deadline: number; reason: string };
  slashExecuted: boolean;

  pushAlert: (kind: AlertKind, text: string) => void;
  setStatus: (s: SystemStatus) => void;
  reset: () => void;

  runAttack: (opts?: { swarmSize?: number; disputeSeconds?: number }) => void;
  runSarah: () => void;
};

const BASE_STAKE = 20;
const ELEVATED_STAKE = 2000;
const BASE_BENEFIT = 200;
const ELEVATED_BENEFIT = 20;

export const useDefenseStore = create<DefenseState>((set, get) => ({
  status: "NORMAL",
  multiplier: 1,
  requiredStake: BASE_STAKE,
  attackerCapital: 0,
  attackerBenefits: 0,
  attackerLoss: 0,
  treasuryGain: 0,
  burned: 0,
  alerts: [],
  slashProposal: undefined,
  slashExecuted: false,

  pushAlert: (kind, text) =>
    set((s) => ({
      alerts: [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, text, ts: Date.now() },
        ...s.alerts,
      ].slice(0, 100),
    })),

  setStatus: (status) => set({ status }),

  reset: () => {
    useGraphStore.getState().reset();
    usePortalStore.getState().reset();
    set({
      status: "NORMAL",
      multiplier: 1,
      requiredStake: BASE_STAKE,
      attackerCapital: 0,
      attackerBenefits: 0,
      attackerLoss: 0,
      treasuryGain: 0,
      burned: 0,
      alerts: [],
      slashProposal: undefined,
      slashExecuted: false,
    });
  },

  runSarah: () => {
    const { pushAlert } = get();
    const portal = usePortalStore.getState();
    const graph = useGraphStore.getState();

    pushAlert("success", "New stake locked: 0xSarah… Amount: 20 AED");
    portal.setUserAddress("0xSarah0000000000000000000000000000000001");
    portal.setHasStaked(true);
    graph.addRealUser("sarah");

    setTimeout(() => {
      pushAlert("success", "Benefit claimed: 0xSarah… Amount: 200 AED");
      portal.setHasClaimed(true);
    }, 900);
  },

  runAttack: ({ swarmSize = 1000, disputeSeconds = 30 } = {}) => {
    const { pushAlert, setStatus } = get();
    const portal = usePortalStore.getState();
    const graph = useGraphStore.getState();

    setStatus("NORMAL");

    const masterId = "master-attacker";
    graph.addSwarm(swarmSize, masterId);
    pushAlert("warn", `Incoming: ${swarmSize} wallets locking stake…`);

    setTimeout(() => {
      pushAlert("danger", "TEMPORAL CLUSTERING DETECTED: 847 claims in 60s");
      pushAlert("danger", `COMMON FUNDING SOURCE: ${swarmSize} wallets funded by 0xMaster…`);
      setStatus("UNDER_ATTACK");
      document.documentElement.classList.add("glitch");
      setTimeout(() => document.documentElement.classList.remove("glitch"), 600);

      graph.flagAll();
    }, 1600);

    setTimeout(() => {
      pushAlert("info", "DYNAMIC STAKE SCALING: 1x → 100x");
      pushAlert("info", `Required stake is now ${ELEVATED_STAKE} AED per wallet`);
      set({
        multiplier: 100,
        requiredStake: ELEVATED_STAKE,
        attackerCapital: swarmSize * ELEVATED_STAKE,
      });
      portal.setRequiredStake(ELEVATED_STAKE);
      setStatus("DEFENDED");
    }, 2600);

    setTimeout(() => {
      const benefits = swarmSize * ELEVATED_BENEFIT;
      set({ attackerBenefits: benefits });
      pushAlert("warn", `Attacker benefits capped: ${swarmSize} × ${ELEVATED_BENEFIT} AED = ${benefits} AED`);
    }, 3400);

    setTimeout(() => {
      const deadline = Date.now() + disputeSeconds * 1000;
      set({
        slashProposal: {
          wallets: swarmSize,
          disputeSeconds,
          deadline,
          reason: "Common funding source + Temporal clustering",
        },
      });
      pushAlert("slash", `Slash proposal submitted. Dispute window: ${disputeSeconds}s`);
    }, 4200);

    setTimeout(() => {
      const capital = get().attackerCapital;
      const burned = capital / 2;
      const treasury = capital / 2;
      const loss = capital - get().attackerBenefits;

      set({
        burned,
        treasuryGain: treasury,
        attackerLoss: loss,
        slashExecuted: true,
        slashProposal: undefined,
      });
      setStatus("SLASHED");
      graph.slashAll();
      pushAlert("slash", `SLASH EXECUTED: ${burned.toLocaleString()} AED burned`);
      pushAlert("success", `${treasury.toLocaleString()} AED routed to public treasury`);
    }, 4200 + disputeSeconds * 1000 + 800);
  },
}));
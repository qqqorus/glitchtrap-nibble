import { create } from "zustand";

type PortalState = {
  userAddress?: string;
  requiredStake: number;
  benefitAmount: number;
  hasStaked: boolean;
  hasClaimed: boolean;
  stakeReturned: boolean;

  setUserAddress: (a?: string) => void;
  setRequiredStake: (n: number) => void;
  setHasStaked: (v: boolean) => void;
  setHasClaimed: (v: boolean) => void;
  setStakeReturned: (v: boolean) => void;
  reset: () => void;
};

export const usePortalStore = create<PortalState>((set) => ({
  userAddress: undefined,
  requiredStake: 20,
  benefitAmount: 200,
  hasStaked: false,
  hasClaimed: false,
  stakeReturned: false,

  setUserAddress: (a) => set({ userAddress: a }),
  setRequiredStake: (n) => set({ requiredStake: n }),
  setHasStaked: (v) => set({ hasStaked: v }),
  setHasClaimed: (v) => set({ hasClaimed: v }),
  setStakeReturned: (v) => set({ stakeReturned: v }),
  reset: () =>
    set({
      userAddress: undefined,
      requiredStake: 20,
      benefitAmount: 200,
      hasStaked: false,
      hasClaimed: false,
      stakeReturned: false,
    }),
}));
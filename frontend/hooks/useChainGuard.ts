"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { hardhatLocal } from "@/lib/wagmi";

export function useChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();

  const wrongChain = isConnected && chainId !== hardhatLocal.id;

  useEffect(() => {
    if (wrongChain) {
      switchChain({ chainId: hardhatLocal.id });
    }
  }, [wrongChain, switchChain]);

  return { wrongChain, switching: isPending, switchError: error };
}
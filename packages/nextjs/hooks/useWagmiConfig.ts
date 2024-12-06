"use client";

import { useMemo } from "react";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, metaMaskWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export function useWagmiConfig() {
  const projectId = "949e50a7346865d10fe9757fe8dd9477";
  if (!projectId) {
    const providerErrMessage = "To connect to all Wallets you need to provide a NEXT_PUBLIC_WC_PROJECT_ID env variable";
    throw new Error(providerErrMessage);
  }

  return useMemo(() => {
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Recommended Wallet",
          wallets: [coinbaseWallet],
        },
        {
          groupName: "Other Wallets",
          wallets: [rainbowWallet, metaMaskWallet],
        },
      ],
      {
        appName: "onchainkit",
        projectId,
      },
    );

    const wagmiConfig = createConfig({
      chains: [base, baseSepolia],
      // turn off injected provider discovery
      multiInjectedProviderDiscovery: false,
      connectors,
      ssr: true,
      transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
    });

    return wagmiConfig;
  }, [projectId]);
}

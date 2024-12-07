"use client";

import { Header } from "@/components/Header";
import { useInitializeNativeCurrencyPrice } from "@/hooks/scaffold-eth";
import { wagmiConfig } from "@/services/web3/wagmiConfig";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { HuddleClient, HuddleProvider } from "@huddle01/react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { base } from "viem/chains";
import { WagmiProvider } from "wagmi";

export const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const huddleClient = new HuddleClient({
  projectId: process.env.NEXT_PUBLIC_HUDDLE01_PROJECT_ID || "",
  options: {
    activeSpeakers: {
      size: 8,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <HuddleProvider client={huddleClient}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base}
            projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
            config={{
              appearance: {
                name: "mafia.ai",
                logo: "https://onchainkit.xyz/favicon/48x48.png?v4-19-24",
                mode: "auto",
                theme: "dark",
              },
            }}
          >
            <RainbowKitProvider>
              <ProgressBar height="3px" color="#2299dd" />

              {children}
            </RainbowKitProvider>
          </OnchainKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </HuddleProvider>
  );
};

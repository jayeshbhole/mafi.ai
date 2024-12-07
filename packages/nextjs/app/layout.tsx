import Image from "next/image";
import Link from "next/link";
import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FaucetButton } from "@/components/scaffold-eth";
import "@/styles/globals.css";
import { getMetadata } from "@/utils/scaffold-eth/getMetadata";
import { HuddleClient, HuddleProvider } from "@huddle01/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = getMetadata({ title: "mafia.ai", description: "mafia.ai | Play Mafia with AI" });

const huddleClient = new HuddleClient({
  projectId: process.env.NEXT_PUBLIC_HUDDLE01_PROJECT_ID || "",
  options: {
    activeSpeakers: {
      size: 8,
    },
  },
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <HuddleProvider client={huddleClient}>
            <ScaffoldEthAppWithProviders>
              <header className="flex fixed z-50 top-0 left-0 right-0 justify-between items-center px-4 pt-4">
                <Link href="/" className="h-6 w-6">
                  <Image src="/logo.png" alt="mafia.ai" width={100} height={100} />
                </Link>

                <ConnectButton />
                <FaucetButton />
              </header>

              {children}
            </ScaffoldEthAppWithProviders>
          </HuddleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;

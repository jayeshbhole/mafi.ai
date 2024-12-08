import Image from "next/image";
import Link from "next/link";
import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FaucetButton } from "@/components/scaffold-eth";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import { getMetadata } from "@/utils/scaffold-eth/getMetadata";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = getMetadata({ title: "mafia.ai", description: "mafia.ai | Play Mafia with AI" });

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ScaffoldEthAppWithProviders>
            <header className="flex fixed z-50 top-0 left-0 right-0 justify-between items-center px-4 pt-4">
              <Link href="/" className="h-6 w-6">
                <Image src="/logo.png" alt="mafia.ai" width={100} height={100} />
              </Link>

              <ConnectButton />
              <FaucetButton />
            </header>

            {children}
            <Toaster />
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;

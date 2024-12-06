import getConfig from "next/config";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
// import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/styles/globals.css";
import { getMetadata } from "@/utils/scaffold-eth/getMetadata";
import "@rainbow-me/rainbowkit/styles.css";
import { cookieToInitialState } from "wagmi";

// const ScaffoldEthAppWithProviders = dynamic(
//   () => import("@/components/ScaffoldEthAppWithProviders").then(mod => mod.ScaffoldEthAppWithProviders),
//   {
//     ssr: false,
//   },
// );

export const metadata = getMetadata({ title: "mafia.ai", description: "mafia.ai | Play Mafia with AI" });

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const initialState = cookieToInitialState(getConfig(), headers().get("cookie"));
  return (
    <html suppressHydrationWarning>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <body>
          <ScaffoldEthAppWithProviders initialState={initialState}>
            <main>{children}</main>
          </ScaffoldEthAppWithProviders>
        </body>
      </ThemeProvider>
    </html>
  );
};

export default ScaffoldEthApp;

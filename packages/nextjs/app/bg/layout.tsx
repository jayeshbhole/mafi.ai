import { ScaffoldEthApp } from "@/components/ScaffoldEthAppWithProviders";
import "@/styles/globals.css";
import { getMetadata } from "@/utils/scaffold-eth/getMetadata";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = getMetadata({ title: "Scaffold-ETH 2 App", description: "Built with 🏗 Scaffold-ETH 2" });

const ScaffoldEthAppLayout = ({ children }: { children: React.ReactNode }) => {
  return <ScaffoldEthApp>{children}</ScaffoldEthApp>;
};

export default ScaffoldEthAppLayout;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function AuthScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { address: connectedAddress } = useAccount();

  const active = connectedAddress !== undefined;

  const handleAuth = (type: "signup" | "login") => {
    router.push("/rooms");
    if (type === "signup" && !name) {
      alert("Please enter your name");
      return;
    }
    if (!email) {
      alert("Please enter your email");
      return;
    }
    if (!active) {
      alert("Please connect your wallet first");
      return;
    }
  };

  if (connectedAddress) {
    router.push("/rooms");
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>channel your inner mafia.ai!</CardTitle>
        <CardDescription>Sign up to play</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger disabled value="login">
              Login
            </TabsTrigger>
          </TabsList>
          <TabsContent value="signup">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAuth("signup");
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Input id="name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Input id="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="login">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAuth("login");
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Input id="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex w-full flex-col space-y-2 *:w-full">
        <ConnectButton />
      </CardFooter>
    </Card>
  );
}

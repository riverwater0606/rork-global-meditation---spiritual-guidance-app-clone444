import { MiniKitProvider as WorldCoinMiniKitProvider } from "@worldcoin/minikit-js";
import React, { ReactNode } from "react";
import { useUser } from "@/providers/UserProvider";

interface Props {
  children: ReactNode;
}

export default function MiniKitProvider({ children }: Props) {
  const { walletAddress } = useUser();

  return (
    <WorldCoinMiniKitProvider
      app_id={process.env.EXPO_PUBLIC_WLD_APP_ID!}
      action="psig"
      signal={walletAddress ?? ""}
    >
      {children}
    </WorldCoinMiniKitProvider>
  );
}
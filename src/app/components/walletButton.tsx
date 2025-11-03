"use client";

import { createWallet, inAppWallet } from "thirdweb/wallets";
import { torusMainnet, torusTestnet } from "$/constants/chains";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import appConfig from "@/config";
import {
  bsc,
  bscTestnet,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: appConfig.services.thirdweb.clientId,
});

const chains = appConfig.environment.isDevelopment
  ? [
      torusTestnet,
      torusMainnet,
      mainnet,
      bsc,
      polygon,
      bscTestnet,
      polygonAmoy,
      sepolia,
    ]
  : [torusMainnet, mainnet, bsc, polygon];

const metadata = {
  name: "unreal",
  url: "https://art.ideomind.org",
  description: "An ai media agent",
};

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "apple", "email", "passkey"],
    },
  }),
  createWallet("walletConnect"),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

const WalletButton: React.FC = () => {
  return (
    <ConnectButton
      theme={"dark"}
      appMetadata={metadata}
      client={client}
      wallets={wallets}
      chains={chains}
    />
  );
};

export default WalletButton;

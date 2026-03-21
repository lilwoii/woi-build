import React, { useEffect, useMemo, useState } from "react";
import { createWeb3Modal, defaultConfig } from "@walletconnect/modal";
import { ethers } from "ethers";

const projectId = "WOI_WALLETCONNECT_PROJECT_ID_PLACEHOLDER";

const metadata = {
  name: "WOI",
  description: "WOI Polymarket Wallet Connection",
  url: "http://localhost",
  icons: ["https://walletconnect.com/walletconnect-logo.png"]
};

const chains = [
  {
    chainId: 137,
    name: "Polygon",
    currency: "MATIC",
    explorerUrl: "https://polygonscan.com",
    rpcUrl: "https://polygon-rpc.com"
  }
];

let modal;

export default function WalletConnectButton({ onConnected }) {
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (!modal) {
      const ethersConfig = defaultConfig({ metadata, enableEIP6963: true, enableInjected: true, enableCoinbase: true, rpcUrl: chains[0].rpcUrl });
      modal = createWeb3Modal({ ethersConfig, chains, projectId, enableAnalytics: false });
    }
  }, []);

  const connect = async () => {
    try {
      await modal.open();
      const provider = modal.getWalletProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();
      const net = await ethersProvider.getNetwork();

      setAddress(addr);
      setNetwork(net?.name || `chain:${net?.chainId}`);
      onConnected?.({ address: addr, chainId: Number(net?.chainId || 0) });
    } catch (e) {
      console.error(e);
    }
  };

  const disconnect = async () => {
    try {
      await modal.disconnect();
    } catch {}
    setAddress(null);
    setNetwork(null);
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      {!address ? (
        <button
          onClick={connect}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,200,0.22)",
            background: "rgba(0,255,200,0.10)",
            color: "rgba(220,255,248,0.95)",
            cursor: "pointer",
            fontWeight: 800
          }}
        >
          Connect Wallet (MetaMask / WalletConnect)
        </button>
      ) : (
        <>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Connected: <span style={{ fontWeight: 800 }}>{address.slice(0, 6)}…{address.slice(-4)}</span> • {network}
          </div>
          <button
            onClick={disconnect}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,120,120,0.28)",
              background: "rgba(255,120,120,0.08)",
              color: "rgba(255,230,230,0.95)",
              cursor: "pointer",
              fontWeight: 800
            }}
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}

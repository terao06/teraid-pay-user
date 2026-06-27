import { createConfig, http } from "wagmi";
import { avalancheFuji, polygonAmoy, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const rpcUrls = {
  ethereumSepolia: process.env.REACT_APP_RPC_URL_ETHEREUM_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
  avalancheFuji: process.env.REACT_APP_RPC_URL_AVALANCHE_FUJI || "https://avalanche-fuji-c-chain-rpc.publicnode.com",
  polygonAmoy: process.env.REACT_APP_RPC_URL_POLYGON_AMOY || "https://rpc-amoy.polygon.technology",
};

export const wagmiConfig = createConfig({
  chains: [sepolia, avalancheFuji, polygonAmoy],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(rpcUrls.ethereumSepolia),
    [avalancheFuji.id]: http(rpcUrls.avalancheFuji),
    [polygonAmoy.id]: http(rpcUrls.polygonAmoy),
  },
});

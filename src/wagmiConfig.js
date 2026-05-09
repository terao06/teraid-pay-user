import { createConfig, http } from "wagmi";
import { mainnet, polygon, polygonAmoy, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [polygon, polygonAmoy, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(process.env.REACT_APP_RPC_URL_ETHEREUM_MAINNET),
    [polygon.id]: http(process.env.REACT_APP_RPC_URL_POLYGON_MAINNET),
    [polygonAmoy.id]: http(process.env.REACT_APP_RPC_URL_POLYGON_AMOY),
    [sepolia.id]: http(process.env.REACT_APP_RPC_URL_ETHEREUM_SEPOLIA),
  },
});

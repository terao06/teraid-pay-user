const rpcUrls = {
  ethereumSepolia: process.env.REACT_APP_RPC_URL_ETHEREUM_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
  avalancheFuji: process.env.REACT_APP_RPC_URL_AVALANCHE_FUJI || "https://avalanche-fuji-c-chain-rpc.publicnode.com",
  polygonAmoy: process.env.REACT_APP_RPC_URL_POLYGON_AMOY || "https://rpc-amoy.polygon.technology",
};
const jpycTokenAddress =
  process.env.REACT_APP_JPYC_TOKEN_ADDRESS || "0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29";

export function resolveJpycTokenAddress(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "sepolia") return jpycTokenAddress;
  if (chainType === "avalanche" && networkName === "fuji") return jpycTokenAddress;
  if (chainType === "polygon" && networkName === "amoy") return jpycTokenAddress;
  return undefined;
}

export function resolveRpcUrl(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "sepolia") return rpcUrls.ethereumSepolia;
  if (chainType === "avalanche" && networkName === "fuji") return rpcUrls.avalancheFuji;
  if (chainType === "polygon" && networkName === "amoy") return rpcUrls.polygonAmoy;
  return undefined;
}

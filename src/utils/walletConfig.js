export function resolveJpycTokenAddress(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "mainnet") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_ETHEREUM_MAINNET;
  if (chainType === "ethereum" && networkName === "sepolia") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_ETHEREUM_SEPOLIA;
  if (chainType === "polygon" && networkName === "polygon") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_POLYGON_MAINNET;
  if (chainType === "polygon" && networkName === "amoy") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_POLYGON_AMOY;
  return undefined;
}

export function resolveRpcUrl(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "mainnet") return process.env.REACT_APP_RPC_URL_ETHEREUM_MAINNET;
  if (chainType === "ethereum" && networkName === "sepolia") return process.env.REACT_APP_RPC_URL_ETHEREUM_SEPOLIA;
  if (chainType === "polygon" && networkName === "polygon") return process.env.REACT_APP_RPC_URL_POLYGON_MAINNET;
  if (chainType === "polygon" && networkName === "amoy") return process.env.REACT_APP_RPC_URL_POLYGON_AMOY;
  return undefined;
}

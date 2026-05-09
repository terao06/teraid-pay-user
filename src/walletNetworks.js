export const walletNetworkOptions = [
  {
    key: "ethereum-sepolia",
    label: "Ethereum / Sepolia",
    chainType: "ethereum",
    networkName: "sepolia",
    tokenSymbol: "JPYC",
    chainId: 11155111,
  },
  {
    key: "ethereum-mainnet",
    label: "Ethereum / Mainnet",
    chainType: "ethereum",
    networkName: "mainnet",
    tokenSymbol: "JPYC",
    chainId: 1,
  },
  {
    key: "polygon-amoy",
    label: "Polygon / Amoy",
    chainType: "polygon",
    networkName: "amoy",
    tokenSymbol: "JPYC",
    chainId: 80002,
  },
  {
    key: "polygon-mainnet",
    label: "Polygon / Polygon Mainnet",
    chainType: "polygon",
    networkName: "polygon",
    tokenSymbol: "JPYC",
    chainId: 137,
  },
];

export function findWalletNetworkOption(chainType, networkName) {
  return walletNetworkOptions.find(
    (option) => option.chainType === chainType && option.networkName === networkName,
  );
}

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
    key: "avalanche-fuji",
    label: "Avalanche / Fuji",
    chainType: "avalanche",
    networkName: "fuji",
    tokenSymbol: "JPYC",
    chainId: 43113,
  },
  {
    key: "polygon-amoy",
    label: "Polygon / Amoy",
    chainType: "polygon",
    networkName: "amoy",
    tokenSymbol: "JPYC",
    chainId: 80002,
  },
];

export function findWalletNetworkOption(chainType, networkName) {
  return walletNetworkOptions.find(
    (option) => option.chainType === chainType && option.networkName === networkName,
  );
}

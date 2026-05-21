import { useMemo } from "react";
import { isAddress } from "viem";
import { useBalance } from "wagmi";

import { formatBalanceAmount } from "../utils/formatters";
import { resolveJpycTokenAddress, resolveRpcUrl } from "../utils/walletConfig";
import { findWalletNetworkOption } from "../walletNetworks";

export function useWalletBalance(wallet) {
  const chainId = wallet ? findWalletNetworkOption(wallet.chain_type, wallet.network_name)?.chainId : undefined;
  const jpycTokenAddress = wallet ? resolveJpycTokenAddress(wallet.chain_type, wallet.network_name) : undefined;
  const rpcUrl = wallet ? resolveRpcUrl(wallet.chain_type, wallet.network_name) : undefined;
  const walletAddressForBalance = wallet && isAddress(wallet.wallet_address) ? wallet.wallet_address : undefined;
  const jpycTokenContractAddress =
    jpycTokenAddress && isAddress(jpycTokenAddress) ? jpycTokenAddress : undefined;
  const canReadBalance = Boolean(
    wallet && chainId && rpcUrl && walletAddressForBalance && jpycTokenContractAddress,
  );
  const {
    data: balance,
    isFetching: isBalanceFetching,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance({
    address: canReadBalance ? walletAddressForBalance : undefined,
    chainId,
    token: canReadBalance ? jpycTokenContractAddress : undefined,
    query: {
      enabled: canReadBalance,
    },
  });

  const balanceText = useMemo(() => {
    if (!wallet) return "--";
    if (!chainId) return "未対応ネットワーク";
    if (!jpycTokenAddress) return "JPYCトークン未設定";
    if (!rpcUrl) return "RPCエンドポイント未設定";
    if (!isAddress(jpycTokenAddress) || !isAddress(wallet.wallet_address)) return "アドレス設定エラー";
    if (isBalanceFetching) return "取得中...";
    if (balanceError) return "取得失敗";
    if (!balance) return "--";
    return `${formatBalanceAmount(balance.formatted)} ${balance.symbol || "JPYC"}`;
  }, [balance, balanceError, chainId, isBalanceFetching, jpycTokenAddress, rpcUrl, wallet]);

  return {
    balanceText,
    refetchBalance,
  };
}

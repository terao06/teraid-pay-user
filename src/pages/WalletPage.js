import { Alert, Backdrop, CircularProgress } from "@mui/material";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useEffect, useState } from "react";
import { erc20Abi, isAddress, maxUint256 } from "viem";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import AppSnackbar from "../components/AppSnackbar";
import DeleteWalletDialog from "../components/DeleteWalletDialog";
import WalletDetailCard from "../components/WalletDetailCard";
import WalletPageHeader from "../components/WalletPageHeader";
import { DEFAULT_WALLET_NETWORK, USER_ID } from "../config/appConfig";
import {
  deleteWallet,
  fetchWallet,
  fetchWalletApproval,
  issueWalletNonce,
  markWalletApproved,
  registerWallet,
} from "../clients/walletClient";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { getJapaneseErrorMessage } from "../utils/api";
import WalletRegisterDialog from "../WalletRegisterDialog";
import { wagmiConfig } from "../wagmiConfig";
import { findWalletNetworkOption } from "../walletNetworks";

export default function WalletPage({ onNavigate }) {
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { disconnect } = useDisconnect();

  const [chainType, setChainType] = useState(DEFAULT_WALLET_NETWORK.chainType);
  const [networkName, setNetworkName] = useState(DEFAULT_WALLET_NETWORK.networkName);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const { balanceText, refetchBalance } = useWalletBalance(currentWallet);

  const actionDisabled = isRegistering || isDeleting || isRefreshing || isApproving;
  const isBusy = isLoadingWallet || actionDisabled;

  const showToast = (severity, message) => {
    setToastState({ open: true, severity, message });
  };

  const resetDialogForm = () => {
    setChainType(DEFAULT_WALLET_NETWORK.chainType);
    setNetworkName(DEFAULT_WALLET_NETWORK.networkName);
  };

  const loadWallet = async () => {
    try {
      setIsLoadingWallet(true);
      setCurrentWallet(await fetchWallet());
    } catch (error) {
      setCurrentWallet(null);
      showToast("error", getJapaneseErrorMessage(error, "ウォレット情報の取得に失敗しました。"));
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const refreshWallet = async () => {
    try {
      setIsRefreshing(true);
      await loadWallet();
      await refetchBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openRegisterDialog = () => {
    disconnect();
    resetDialogForm();
    setIsDialogOpen(true);
  };

  const closeRegisterDialog = () => {
    if (!isRegistering) setIsDialogOpen(false);
  };

  const loadWalletApproval = async () => {
    const approval = await fetchWalletApproval();
    if (
      !isAddress(approval.wallet_address) ||
      !isAddress(approval.token_contract_address) ||
      !isAddress(approval.spender_address)
    ) {
      throw new Error("承認情報のアドレス形式が不正です。");
    }

    return approval;
  };

  const writeWalletApprovalAmount = async (approval, amount) => {
    if (!connectedAddress) {
      throw new Error("ウォレットを接続してください。");
    }

    if (approval.wallet_address.toLowerCase() !== connectedAddress.toLowerCase()) {
      throw new Error("登録済みのウォレットアドレスで接続してください。");
    }

    if (connectedChainId !== approval.chain_id) {
      await switchChainAsync({ chainId: approval.chain_id });
    }

    const hash = await writeContractAsync({
      address: approval.token_contract_address,
      abi: erc20Abi,
      functionName: "approve",
      args: [approval.spender_address, amount],
      chainId: approval.chain_id,
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: approval.chain_id,
    });

    if (receipt.status !== "success") {
      throw new Error("承認トランザクションが失敗しました。");
    }

    return hash;
  };

  const handleRegisterWallet = async () => {
    const normalizedAddress = connectedAddress || "";

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
      showToast("error", "先にウォレットを接続してください。");
      return;
    }

    if (!chainType.trim() || !networkName.trim()) {
      showToast("error", "ネットワークを選択してください。");
      return;
    }

    const selectedNetwork = findWalletNetworkOption(chainType.trim(), networkName.trim());
    if (!selectedNetwork) {
      showToast("error", "未対応のネットワークです。");
      return;
    }

    try {
      setIsRegistering(true);

      const nonce = await issueWalletNonce({
        walletAddress: normalizedAddress,
        chainType: selectedNetwork.chainType,
        networkName: selectedNetwork.networkName,
      });

      const signature = await signMessageAsync({ message: nonce });
      await registerWallet({ walletAddress: normalizedAddress, signature, network: selectedNetwork });

      showToast("success", "ウォレットを登録しました。");
      setIsDialogOpen(false);
      resetDialogForm();
      await loadWallet();
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "ウォレット登録に失敗しました。"));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteWallet = async () => {
    if (!currentWallet) return;

    try {
      setIsDeleting(true);

      if (currentWallet.is_approval) {
        const approval = await loadWalletApproval();
        await writeWalletApprovalAmount(approval, 0n);
      }

      await deleteWallet(currentWallet.wallet_id);

      setCurrentWallet(null);
      showToast("success", "ウォレットを削除しました。");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "ウォレット削除に失敗しました。"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveWallet = async () => {
    if (!currentWallet) return;

    if (!connectedAddress) {
      showToast("error", "承認するウォレットを接続してください。");
      return;
    }

    if (connectedAddress.toLowerCase() !== currentWallet.wallet_address.toLowerCase()) {
      showToast("error", "登録済みのウォレットアドレスで接続してください。");
      return;
    }

    try {
      setIsApproving(true);

      const approval = await loadWalletApproval();
      const approvalTxHash = await writeWalletApprovalAmount(approval, maxUint256);

      await markWalletApproved(currentWallet.wallet_id, approvalTxHash);

      showToast("success", "ウォレットを承認しました。");
      await loadWallet();
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "ウォレット承認に失敗しました。"));
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    loadWallet();
    // プロトタイプ API はユーザー 104 のみ対応しているため、ウォレット情報は初回だけ読み込みます。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <WalletPageHeader
        userId={USER_ID}
        hasWallet={Boolean(currentWallet)}
        isLoadingWallet={isLoadingWallet}
        actionDisabled={actionDisabled}
        onBackToUserInfo={() => onNavigate("home")}
        onDeleteWallet={() => setIsDeleteDialogOpen(true)}
        onOpenRegisterDialog={openRegisterDialog}
      />

      {currentWallet === null ? (
        <Alert severity="info" variant="outlined">
          登録済みのウォレットはまだありません。
        </Alert>
      ) : (
        <WalletDetailCard
          wallet={currentWallet}
          balanceText={balanceText}
          actionDisabled={actionDisabled}
          isLoadingWallet={isLoadingWallet}
          isApproving={isApproving}
          onRefreshWallet={refreshWallet}
          onApproveWallet={handleApproveWallet}
        />
      )}

      <WalletRegisterDialog
        open={isDialogOpen}
        chainType={chainType}
        networkName={networkName}
        isRegistering={isRegistering}
        actionDisabled={actionDisabled}
        onClose={closeRegisterDialog}
        onChainTypeChange={setChainType}
        onNetworkNameChange={setNetworkName}
        onRegisterWallet={handleRegisterWallet}
      />

      <AppSnackbar
        toastState={toastState}
        onClose={() => setToastState((current) => ({ ...current, open: false }))}
      />

      <DeleteWalletDialog
        open={isDeleteDialogOpen}
        wallet={currentWallet}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleteWallet={handleDeleteWallet}
      />

      <Backdrop open={isBusy} sx={{ color: "#fff", zIndex: (muiTheme) => muiTheme.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

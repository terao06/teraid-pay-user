import { Alert, Backdrop, CircularProgress } from "@mui/material";
import { readContract } from "@wagmi/core";
import { useEffect, useState } from "react";
import { isAddress, maxUint256, parseSignature } from "viem";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";

import AppSnackbar from "../components/AppSnackbar";
import DeleteWalletDialog from "../components/DeleteWalletDialog";
import WalletDetailCard from "../components/WalletDetailCard";
import WalletPageHeader from "../components/WalletPageHeader";
import { DEFAULT_WALLET_NETWORK, USER_ID } from "../config/appConfig";
import {
  deleteWallet,
  fetchWallet,
  fetchWalletPermit,
  issueWalletNonce,
  updateWalletPermit,
  registerWallet,
} from "../clients/walletClient";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { getJapaneseErrorMessage } from "../utils/api";
import WalletRegisterDialog from "../WalletRegisterDialog";
import { wagmiConfig } from "../wagmiConfig";
import { findWalletNetworkOption } from "../walletNetworks";

const permitTokenAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export default function WalletPage({ onNavigate }) {
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
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
  const [isPermitting, setIsPermitting] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const { balanceText, refetchBalance } = useWalletBalance(currentWallet);

  const actionDisabled = isRegistering || isDeleting || isRefreshing || isPermitting;
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

  const loadWalletPermit = async () => {
    const permit = await fetchWalletPermit();
    if (
      !isAddress(permit.wallet_address) ||
      !isAddress(permit.token_contract_address) ||
      !isAddress(permit.spender_address)
    ) {
      throw new Error("承認情報のアドレス形式が不正です。");
    }

    return permit;
  };

  const createWalletPermitSignature = async (permit, amount) => {
    if (!connectedAddress) {
      throw new Error("ウォレットを接続してください。");
    }

    if (permit.wallet_address.toLowerCase() !== connectedAddress.toLowerCase()) {
      throw new Error("登録済みのウォレットアドレスで接続してください。");
    }

    if (connectedChainId !== permit.chain_id) {
      await switchChainAsync({ chainId: permit.chain_id });
    }

    const [tokenName, nonce] = await Promise.all([
      readContract(wagmiConfig, {
        address: permit.token_contract_address,
        abi: permitTokenAbi,
        functionName: "name",
        chainId: permit.chain_id,
      }),
      readContract(wagmiConfig, {
        address: permit.token_contract_address,
        abi: permitTokenAbi,
        functionName: "nonces",
        args: [connectedAddress],
        chainId: permit.chain_id,
      }),
    ]);

    const signatureDeadlineDate = new Date();
    signatureDeadlineDate.setFullYear(signatureDeadlineDate.getFullYear() + 5);
    const deadline = Math.floor(signatureDeadlineDate.getTime() / 1000);
    const signature = await signTypedDataAsync({
      domain: {
        name: tokenName,
        version: "1",
        chainId: permit.chain_id,
        verifyingContract: permit.token_contract_address,
      },
      types: permitTypes,
      primaryType: "Permit",
      message: {
        owner: connectedAddress,
        spender: permit.spender_address,
        value: amount,
        nonce,
        deadline,
      },
    });

    const parsedSignature = parseSignature(signature);
    const recoveryId =
      parsedSignature.v !== undefined
        ? Number(parsedSignature.v)
        : 27 + Number(parsedSignature.yParity || 0);

    return {
      allowanceValue: amount,
      signatureDeadline: deadline,
      signatureRecoveryId: recoveryId,
      signatureFirst32Bytes: parsedSignature.r,
      signatureSecond32Bytes: parsedSignature.s,
    };
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
      setIsPermitting(true);

      const permit = await loadWalletPermit();
      const permitSignature = await createWalletPermitSignature(permit, maxUint256);

      await updateWalletPermit(currentWallet.wallet_id, permitSignature);

      showToast("success", "ウォレットを承認しました。");
      await loadWallet();
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "ウォレット承認に失敗しました。"));
    } finally {
      setIsPermitting(false);
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
          isPermitting={isPermitting}
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

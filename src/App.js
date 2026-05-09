import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, isAddress, maxUint256 } from "viem";
import {
  useAccount,
  useBalance,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import "./App.css";
import WalletRegisterDialog from "./WalletRegisterDialog";
import { Web3Providers } from "./Web3Providers";
import { wagmiConfig } from "./wagmiConfig";
import { findWalletNetworkOption } from "./walletNetworks";

const USER_ID = 104;
const DEFAULT_CHAIN_TYPE = "ethereum";
const DEFAULT_NETWORK_NAME = "sepolia";
const API_URL = (process.env.REACT_APP_TERAID_PAY_API || "http://localhost:8005").replace(/\/$/, "");

const theme = createTheme({
  palette: {
    primary: {
      main: "#256f67",
    },
    secondary: {
      main: "#9a3412",
    },
    background: {
      default: "#f4f7f6",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Providers>
        <WalletDetailContent />
      </Web3Providers>
    </ThemeProvider>
  );
}

function WalletDetailContent() {
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { disconnect } = useDisconnect();

  const [chainType, setChainType] = useState(DEFAULT_CHAIN_TYPE);
  const [networkName, setNetworkName] = useState(DEFAULT_NETWORK_NAME);
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

  const chainId = currentWallet
    ? findWalletNetworkOption(currentWallet.chain_type, currentWallet.network_name)?.chainId
    : undefined;
  const jpycTokenAddress = currentWallet
    ? resolveJpycTokenAddress(currentWallet.chain_type, currentWallet.network_name)
    : undefined;
  const rpcUrl = currentWallet
    ? resolveRpcUrl(currentWallet.chain_type, currentWallet.network_name)
    : undefined;
  const walletAddressForBalance =
    currentWallet && isAddress(currentWallet.wallet_address) ? currentWallet.wallet_address : undefined;
  const jpycTokenContractAddress =
    jpycTokenAddress && isAddress(jpycTokenAddress) ? jpycTokenAddress : undefined;
  const canReadBalance = Boolean(
    currentWallet && chainId && rpcUrl && walletAddressForBalance && jpycTokenContractAddress,
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

  const actionDisabled = isRegistering || isDeleting || isRefreshing || isApproving;
  const isBusy = isLoadingWallet || actionDisabled;

  const balanceText = useMemo(() => {
    if (!currentWallet) return "--";
    if (!chainId) return "未対応ネットワーク";
    if (!jpycTokenAddress) return "JPYCトークン未設定";
    if (!rpcUrl) return "RPCエンドポイント未設定";
    if (!isAddress(jpycTokenAddress) || !isAddress(currentWallet.wallet_address)) return "アドレス設定エラー";
    if (isBalanceFetching) return "取得中...";
    if (balanceError) return "取得失敗";
    if (!balance) return "--";
    return `${formatBalanceAmount(balance.formatted)} ${balance.symbol || "JPYC"}`;
  }, [balance, balanceError, chainId, currentWallet, isBalanceFetching, jpycTokenAddress, rpcUrl]);

  const showToast = (severity, message) => {
    setToastState({ open: true, severity, message });
  };

  const resetDialogForm = () => {
    setChainType(DEFAULT_CHAIN_TYPE);
    setNetworkName(DEFAULT_NETWORK_NAME);
  };

  const loadWallet = async () => {
    try {
      setIsLoadingWallet(true);
      const response = await fetch(`${API_URL}/user/${USER_ID}/wallet`);
      const responseJson = await readJson(response);

      if (!response.ok) {
        throw new Error(extractErrorMessage(responseJson, response.status));
      }

      if (!responseJson || responseJson.status !== "success") {
        throw new Error("ウォレット情報の取得に失敗しました。");
      }

      setCurrentWallet(responseJson.data);
    } catch (error) {
      setCurrentWallet(null);
      showToast("error", error instanceof Error ? error.message : "ウォレット情報の取得に失敗しました。");
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
    const approvalResponse = await fetch(`${API_URL}/user/${USER_ID}/wallet/approval`);
    const approvalJson = await readJson(approvalResponse);

    if (!approvalResponse.ok) {
      throw new Error(extractErrorMessage(approvalJson, approvalResponse.status));
    }

    if (!approvalJson || approvalJson.status !== "success") {
      throw new Error("approve 情報の取得に失敗しました。");
    }

    const approval = approvalJson.data;
    if (
      !isAddress(approval.wallet_address) ||
      !isAddress(approval.token_contract_address) ||
      !isAddress(approval.spender_address)
    ) {
      throw new Error("approve 情報のアドレス形式が不正です。");
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
      throw new Error("approve トランザクションが失敗しました。");
    }
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

      const nonceResponse = await fetch(`${API_URL}/user/${USER_ID}/wallet/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: normalizedAddress,
          chain_type: selectedNetwork.chainType,
          network_name: selectedNetwork.networkName,
        }),
      });
      const nonceJson = await readJson(nonceResponse);

      if (!nonceResponse.ok) {
        throw new Error(extractErrorMessage(nonceJson, nonceResponse.status));
      }

      if (!nonceJson || nonceJson.status !== "success") {
        throw new Error("nonce の発行に失敗しました。");
      }

      const signature = await signMessageAsync({ message: nonceJson.data.nonce });

      const verifyResponse = await fetch(`${API_URL}/user/${USER_ID}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: normalizedAddress,
          signature,
          chain_type: selectedNetwork.chainType,
          network_name: selectedNetwork.networkName,
          token_symbol: selectedNetwork.tokenSymbol,
          chain_id: selectedNetwork.chainId,
        }),
      });
      const verifyJson = await readJson(verifyResponse);

      if (!verifyResponse.ok) {
        throw new Error(extractErrorMessage(verifyJson, verifyResponse.status));
      }

      if (!verifyJson || verifyJson.status !== "success") {
        throw new Error("ウォレット登録に失敗しました。");
      }

      showToast("success", "ウォレットを登録しました。");
      setIsDialogOpen(false);
      resetDialogForm();
      await loadWallet();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "ウォレット登録に失敗しました。");
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

      const response = await fetch(`${API_URL}/user/${USER_ID}/wallet/${currentWallet.wallet_id}`, {
        method: "DELETE",
      });
      const responseJson = await readJson(response);

      if (!response.ok) {
        throw new Error(extractErrorMessage(responseJson, response.status));
      }

      setCurrentWallet(null);
      showToast("success", "ウォレットを削除しました。");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "ウォレット削除に失敗しました。");
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
      await writeWalletApprovalAmount(approval, maxUint256);

      const stateResponse = await fetch(`${API_URL}/user/${USER_ID}/wallet/${currentWallet.wallet_id}/approval`, {
        method: "POST",
      });
      const stateJson = await readJson(stateResponse);

      if (!stateResponse.ok) {
        throw new Error(extractErrorMessage(stateJson, stateResponse.status));
      }

      if (!stateJson || stateJson.status !== "success") {
        throw new Error("approve 状態の更新に失敗しました。");
      }

      showToast("success", "ウォレットを承認しました。");
      await loadWallet();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "ウォレット承認に失敗しました。");
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    loadWallet();
    // Wallet data should be loaded once because the prototype API only supports user 104.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box className="wallet-page">
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} className="wallet-header">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                ウォレット詳細
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User ID {USER_ID}
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              {currentWallet ? (
                <Button onClick={() => setIsDeleteDialogOpen(true)} variant="outlined" color="error" disabled={actionDisabled}>
                  削除
                </Button>
              ) : null}
              {!currentWallet && !isLoadingWallet ? (
                <Button
                  variant="outlined"
                  startIcon={<AccountBalanceWalletRoundedIcon />}
                  onClick={openRegisterDialog}
                  disabled={actionDisabled}
                >
                  登録
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {currentWallet === null ? (
            <Alert severity="info" variant="outlined">
              登録済みのウォレットはまだありません。
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 2, px: 3, py: 1 }}>
              <Stack direction="row" className="wallet-section-title">
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  ウォレット
                </Typography>
                <Tooltip title="再読み込み">
                  <span>
                    <IconButton
                      aria-label="再読み込み"
                      onClick={refreshWallet}
                      disabled={actionDisabled || isLoadingWallet}
                      size="small"
                    >
                      <RefreshRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Divider />
              <DetailRow label="Wallet ID" value={<Typography variant="body2">#{currentWallet.wallet_id}</Typography>} />
              <Divider />
              <DetailRow
                label="Wallet Address"
                value={
                  <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                    {currentWallet.wallet_address}
                  </Typography>
                }
              />
              <Divider />
              <DetailRow label="Chain Type" value={<Typography variant="body2">{currentWallet.chain_type}</Typography>} />
              <Divider />
              <DetailRow label="Network" value={<Typography variant="body2">{currentWallet.network_name}</Typography>} />
              <Divider />
              <DetailRow label="Token" value={<Typography variant="body2">{currentWallet.token_symbol}</Typography>} />
              <Divider />
              <DetailRow label="Chain ID" value={<Typography variant="body2">{currentWallet.chain_id}</Typography>} />
              <Divider />
              <DetailRow label="JPYC Balance" value={<BalancePanel balanceText={balanceText} />} />
              <Divider />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    size="small"
                    label={currentWallet.is_active ? "有効" : "無効"}
                    color={currentWallet.is_active ? "success" : "warning"}
                  />
                }
              />
              <Divider />
              <DetailRow
                label="Approval"
                value={
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
                    <Chip
                      size="small"
                      label={currentWallet.is_approval ? "承認済み" : "未承認"}
                      color={currentWallet.is_approval ? "success" : "warning"}
                    />
                    {!currentWallet.is_approval ? (
                      <Button onClick={handleApproveWallet} variant="contained" size="small" disabled={actionDisabled}>
                        {isApproving ? "承認中..." : "承認"}
                      </Button>
                    ) : null}
                  </Stack>
                }
              />
              <Divider />
              <DetailRow label="Verified At" value={<Typography variant="body2">{formatDateTime(currentWallet.verified_at, "未認証")}</Typography>} />
              <Divider />
              <DetailRow label="Created At" value={<Typography variant="body2">{formatDateTime(currentWallet.created_at, "--")}</Typography>} />
              <Divider />
              <DetailRow label="Updated At" value={<Typography variant="body2">{formatDateTime(currentWallet.updated_at, "--")}</Typography>} />
            </Paper>
          )}
        </Stack>
      </Container>

      <WalletRegisterDialog
        open={isDialogOpen}
        connectedAddress={connectedAddress || ""}
        chainType={chainType}
        networkName={networkName}
        isRegistering={isRegistering}
        actionDisabled={actionDisabled}
        onClose={closeRegisterDialog}
        onChainTypeChange={setChainType}
        onNetworkNameChange={setNetworkName}
        onRegisterWallet={handleRegisterWallet}
      />

      <Snackbar
        open={toastState.open}
        autoHideDuration={4000}
        onClose={() => setToastState((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={toastState.severity}
          variant="filled"
          onClose={() => setToastState((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {toastState.message}
        </Alert>
      </Snackbar>

      <Dialog open={isDeleteDialogOpen} onClose={() => !isDeleting && setIsDeleteDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>ウォレットを削除しますか？</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              削除後は登録情報が画面から消えます。必要な場合は再度ウォレット登録を行ってください。
            </Typography>
            {currentWallet ? (
              <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {currentWallet.wallet_address}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button onClick={handleDeleteWallet} color="error" variant="contained" disabled={isDeleting || !currentWallet}>
            {isDeleting ? "削除中..." : "削除する"}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={isBusy} sx={{ color: "#fff", zIndex: (muiTheme) => muiTheme.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Stack>
  );
}

function BalancePanel({ balanceText }) {
  return (
    <Box className="balance-panel">
      <Stack spacing={0.8}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            残高
          </Typography>
          <Chip size="small" label="JPYC" color="primary" sx={{ fontWeight: 700 }} />
        </Stack>
        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "monospace", overflowWrap: "anywhere" }}>
          {balanceText}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          1 JPYC = 1 円
        </Typography>
      </Stack>
    </Box>
  );
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(responseJson, status) {
  if (
    responseJson &&
    typeof responseJson === "object" &&
    responseJson.detail &&
    typeof responseJson.detail === "object" &&
    typeof responseJson.detail.message === "string"
  ) {
    return responseJson.detail.message;
  }

  return `API request failed. HTTP ${status}`;
}

function formatDateTime(value, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBalanceAmount(value) {
  const [integerPart, decimalPart] = value.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!decimalPart) return groupedInteger;

  const trimmedDecimal = decimalPart.replace(/0+$/, "").slice(0, 4);
  return trimmedDecimal ? `${groupedInteger}.${trimmedDecimal}` : groupedInteger;
}

function resolveJpycTokenAddress(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "mainnet") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_ETHEREUM_MAINNET;
  if (chainType === "ethereum" && networkName === "sepolia") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_ETHEREUM_SEPOLIA;
  if (chainType === "polygon" && networkName === "polygon") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_POLYGON_MAINNET;
  if (chainType === "polygon" && networkName === "amoy") return process.env.REACT_APP_JPYC_TOKEN_ADDRESS_POLYGON_AMOY;
  return undefined;
}

function resolveRpcUrl(chainType, networkName) {
  if (chainType === "ethereum" && networkName === "mainnet") return process.env.REACT_APP_RPC_URL_ETHEREUM_MAINNET;
  if (chainType === "ethereum" && networkName === "sepolia") return process.env.REACT_APP_RPC_URL_ETHEREUM_SEPOLIA;
  if (chainType === "polygon" && networkName === "polygon") return process.env.REACT_APP_RPC_URL_POLYGON_MAINNET;
  if (chainType === "polygon" && networkName === "amoy") return process.env.REACT_APP_RPC_URL_POLYGON_AMOY;
  return undefined;
}

export default App;

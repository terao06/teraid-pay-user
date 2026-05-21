import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { walletNetworkOptions } from "./walletNetworks";

export default function WalletRegisterDialog({
  open,
  chainType,
  networkName,
  isRegistering,
  actionDisabled,
  onClose,
  onChainTypeChange,
  onNetworkNameChange,
  onRegisterWallet,
}) {
  const { address, chain, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>ウォレット登録</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Alert severity="info">
            ウォレットを接続し、表示される確認メッセージに署名すると登録が完了します。
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
            {isConnected ? (
              <Button variant="outlined" onClick={() => disconnect()} disabled={actionDisabled}>
                接続解除
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => connector && connect({ connector })}
                disabled={!connector || isPending || actionDisabled}
              >
                {isPending ? "接続中..." : "ウォレット接続"}
              </Button>
            )}
            <Typography
              variant="body2"
              sx={{
                color: isConnected ? "text.primary" : "text.disabled",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {isConnected ? `${address}${chain ? ` / ${chain.name}` : ""}` : "未接続"}
            </Typography>
          </Stack>
          <FormControl fullWidth size="small">
            <Select
              value={chainType && networkName ? `${chainType}-${networkName}` : ""}
              onChange={(event) => {
                const option = walletNetworkOptions.find((item) => item.key === event.target.value);
                if (option) {
                  onChainTypeChange(option.chainType);
                  onNetworkNameChange(option.networkName);
                }
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>
                ネットワークを選択してください
              </MenuItem>
              {walletNetworkOptions.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={onRegisterWallet}
            disabled={actionDisabled}
            sx={{ fontWeight: 800, alignSelf: "flex-start" }}
          >
            署名して登録
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isRegistering}>
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
}

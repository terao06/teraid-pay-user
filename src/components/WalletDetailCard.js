import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Alert, Button, Chip, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";

import BalancePanel from "./BalancePanel";
import DetailRow from "./DetailRow";
import { formatDateTime } from "../utils/formatters";

export default function WalletDetailCard({
  wallet,
  balanceText,
  actionDisabled,
  isLoadingWallet,
  isPermitting,
  onRefreshWallet,
  onApproveWallet,
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, px: 3, py: 1 }}>
      <Stack direction="row" className="wallet-section-title">
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          ウォレット
        </Typography>
        <Tooltip title="再読み込み">
          <span>
            <IconButton
              aria-label="再読み込み"
              onClick={onRefreshWallet}
              disabled={actionDisabled || isLoadingWallet}
              size="small"
            >
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Divider />
      {!wallet.is_permitted ? (
        <>
          <Alert severity="warning" sx={{ my: 2 }}>
            このウォレットは未承認です。利用するには承認を行ってください。
          </Alert>
          <Divider />
        </>
      ) : null}
      <DetailRow label="Wallet ID" value={<Typography variant="body2">#{wallet.wallet_id}</Typography>} />
      <Divider />
      <DetailRow
        label="Wallet Address"
        value={
          <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
            {wallet.wallet_address}
          </Typography>
        }
      />
      <Divider />
      <DetailRow label="Chain Type" value={<Typography variant="body2">{wallet.chain_type}</Typography>} />
      <Divider />
      <DetailRow label="Network" value={<Typography variant="body2">{wallet.network_name}</Typography>} />
      <Divider />
      <DetailRow label="Token" value={<Typography variant="body2">{wallet.token_symbol}</Typography>} />
      <Divider />
      <DetailRow label="Chain ID" value={<Typography variant="body2">{wallet.chain_id}</Typography>} />
      <Divider />
      <DetailRow label="JPYC Balance" value={<BalancePanel balanceText={balanceText} />} />
      <Divider />
      <DetailRow
        label="Status"
        value={
          <Chip
            size="small"
            label={wallet.is_active ? "有効" : "無効"}
            color={wallet.is_active ? "success" : "warning"}
          />
        }
      />
      <Divider />
      <DetailRow
        label="Permit"
        value={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Chip
              size="small"
              label={wallet.is_permitted ? "許可済み" : "未許可"}
              color={wallet.is_permitted ? "success" : "warning"}
            />
            {!wallet.is_permitted ? (
              <Button onClick={onApproveWallet} variant="contained" size="small" disabled={actionDisabled}>
                {isPermitting ? "許可中..." : "許可"}
              </Button>
            ) : null}
          </Stack>
        }
      />
      <Divider />
      <DetailRow label="Verified At" value={<Typography variant="body2">{formatDateTime(wallet.verified_at, "未認証")}</Typography>} />
      <Divider />
      <DetailRow label="Created At" value={<Typography variant="body2">{formatDateTime(wallet.created_at, "--")}</Typography>} />
      <Divider />
      <DetailRow label="Updated At" value={<Typography variant="body2">{formatDateTime(wallet.updated_at, "--")}</Typography>} />
    </Paper>
  );
}

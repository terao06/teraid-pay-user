import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function WalletPageHeader({
  userId,
  hasWallet,
  isLoadingWallet,
  actionDisabled,
  onDeleteWallet,
  onOpenRegisterDialog,
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} className="wallet-header">
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          ウォレット詳細
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User ID {userId}
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {hasWallet ? (
          <Button onClick={onDeleteWallet} variant="outlined" color="error" disabled={actionDisabled}>
            削除
          </Button>
        ) : null}
        {!hasWallet && !isLoadingWallet ? (
          <Button
            variant="outlined"
            startIcon={<AccountBalanceWalletRoundedIcon />}
            onClick={onOpenRegisterDialog}
            disabled={actionDisabled}
          >
            登録
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

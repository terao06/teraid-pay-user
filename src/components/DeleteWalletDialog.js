import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

export default function DeleteWalletDialog({ open, wallet, isDeleting, onClose, onDeleteWallet }) {
  return (
    <Dialog open={open} onClose={() => !isDeleting && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>ウォレットを削除しますか？</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            削除後は登録情報が画面から消えます。必要な場合は再度ウォレット登録を行ってください。
          </Typography>
          {wallet ? (
            <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              {wallet.wallet_address}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button onClick={onDeleteWallet} color="error" variant="contained" disabled={isDeleting || !wallet}>
          {isDeleting ? "削除中..." : "削除する"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

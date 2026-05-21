import { Box, Chip, Stack, Typography } from "@mui/material";

export default function BalancePanel({ balanceText }) {
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

import { Box, Stack, Typography } from "@mui/material";

export default function DetailRow({ label, value }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Stack>
  );
}

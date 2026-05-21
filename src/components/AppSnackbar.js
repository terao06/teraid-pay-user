import { Alert, Snackbar } from "@mui/material";

export default function AppSnackbar({ toastState, onClose }) {
  return (
    <Snackbar
      open={toastState.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert severity={toastState.severity} variant="filled" onClose={onClose} sx={{ width: "100%" }}>
        {toastState.message}
      </Alert>
    </Snackbar>
  );
}

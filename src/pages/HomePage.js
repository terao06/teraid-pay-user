import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FaceRetouchingNaturalRoundedIcon from "@mui/icons-material/FaceRetouchingNaturalRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import AppSnackbar from "../components/AppSnackbar";
import { deleteFace, fetchFaceRegisterStatus } from "../clients/faceClient";
import { fetchWallet } from "../clients/walletClient";
import { USER_ID } from "../config/appConfig";
import { getJapaneseErrorMessage } from "../utils/api";

const initialStatus = {
  isLoading: true,
  isRegistered: false,
  errorMessage: "",
};

export default function HomePage({ onNavigate }) {
  const [walletStatus, setWalletStatus] = useState(initialStatus);
  const [faceStatus, setFaceStatus] = useState(initialStatus);
  const [isDeletingFace, setIsDeletingFace] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (severity, message) => {
    setToastState({ open: true, severity, message });
  };

  const loadStatuses = async () => {
    setWalletStatus((current) => ({ ...current, isLoading: true, errorMessage: "" }));
    setFaceStatus((current) => ({ ...current, isLoading: true, errorMessage: "" }));

    const [walletResult, faceResult] = await Promise.allSettled([
      fetchWallet(),
      fetchFaceRegisterStatus(),
    ]);

    if (walletResult.status === "fulfilled") {
      setWalletStatus({
        isLoading: false,
        isRegistered: Boolean(walletResult.value),
        errorMessage: "",
      });
    } else {
      setWalletStatus({
        isLoading: false,
        isRegistered: false,
        errorMessage: getJapaneseErrorMessage(walletResult.reason, "ウォレット情報の取得に失敗しました。"),
      });
    }

    if (faceResult.status === "fulfilled") {
      setFaceStatus({
        isLoading: false,
        isRegistered: Boolean(faceResult.value?.is_registered),
        errorMessage: "",
      });
    } else {
      setFaceStatus({
        isLoading: false,
        isRegistered: false,
        errorMessage: getJapaneseErrorMessage(faceResult.reason, "顔登録状況の取得に失敗しました。"),
      });
    }
  };

  useEffect(() => {
    loadStatuses();
    // プロトタイプ API はユーザー 104 のみ対応しているため、登録状態は初回だけ読み込みます。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteFace = async () => {
    try {
      setIsDeletingFace(true);
      await deleteFace();
      setFaceStatus({
        isLoading: false,
        isRegistered: false,
        errorMessage: "",
      });
      showToast("success", "顔画像を削除しました。");
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "顔画像の削除に失敗しました。"));
    } finally {
      setIsDeletingFace(false);
    }
  };

  const isLoading = walletStatus.isLoading || faceStatus.isLoading || isDeletingFace;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} className="wallet-header">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ユーザー情報
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User ID {USER_ID}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={isLoading ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
          onClick={loadStatuses}
          disabled={isLoading}
        >
          更新
        </Button>
      </Stack>

      <Box className="status-grid">
        <Box>
          <StatusCard
            title="ウォレット"
            loadingLabel="ウォレット情報を確認中です。"
            registeredLabel="ウォレットは登録済みです。"
            notRegisteredLabel="登録済みのウォレットはまだありません。"
            actionLabel={walletStatus.isRegistered ? "詳細を見る" : "登録へ進む"}
            icon={<AccountBalanceWalletRoundedIcon />}
            status={walletStatus}
            onAction={() => onNavigate("wallet")}
          />
        </Box>
        <Box>
          <StatusCard
            title="顔画像"
            loadingLabel="顔登録状況を確認中です。"
            registeredLabel="顔画像は登録済みです。"
            notRegisteredLabel="登録済みの顔画像はまだありません。"
            actionLabel={faceStatus.isRegistered ? "顔画像を更新する" : "登録へ進む"}
            icon={<FaceRetouchingNaturalRoundedIcon />}
            status={faceStatus}
            onAction={() => onNavigate("face")}
            actionDisabled={isDeletingFace}
            secondaryAction={
              faceStatus.isRegistered
                ? {
                    label: isDeletingFace ? "削除中..." : "削除",
                    icon: <DeleteRoundedIcon />,
                    onClick: handleDeleteFace,
                    disabled: isDeletingFace || faceStatus.isLoading,
                  }
                : null
            }
          />
        </Box>
      </Box>

      <AppSnackbar
        toastState={toastState}
        onClose={() => setToastState((current) => ({ ...current, open: false }))}
      />
    </Stack>
  );
}

function StatusCard({
  title,
  loadingLabel,
  registeredLabel,
  notRegisteredLabel,
  actionLabel,
  icon,
  status,
  onAction,
  actionDisabled = false,
  secondaryAction = null,
}) {
  const severity = status.errorMessage ? "error" : status.isRegistered ? "success" : "info";
  const message = status.errorMessage || (status.isRegistered ? registeredLabel : notRegisteredLabel);

  return (
    <Card variant="outlined" className="status-card">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} className="status-card-title">
            <Box className="status-card-icon">{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
          </Stack>

          {status.isLoading ? (
            <Stack direction="row" spacing={1.5} className="status-card-state">
              <CircularProgress size={20} />
              <Typography color="text.secondary">{loadingLabel}</Typography>
            </Stack>
          ) : (
            <Alert
              severity={severity}
              variant="outlined"
              icon={
                status.isRegistered && !status.errorMessage ? (
                  <CheckCircleRoundedIcon />
                ) : (
                  <ErrorOutlineRoundedIcon />
                )
              }
            >
              {message}
            </Alert>
          )}
        </Stack>
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={onAction} disabled={status.isLoading || actionDisabled}>
          {actionLabel}
        </Button>
        {secondaryAction ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={secondaryAction.icon}
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
      </CardActions>
    </Card>
  );
}

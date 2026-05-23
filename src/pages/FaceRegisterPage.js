import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Alert, Backdrop, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import AppSnackbar from "../components/AppSnackbar";
import FaceRegisterCard from "../components/FaceRegisterCard";
import { fetchFaceRegisterStatus, registerFace, updateFace } from "../clients/faceClient";
import { USER_ID } from "../config/appConfig";
import { getJapaneseErrorMessage } from "../utils/api";

export default function FaceRegisterPage({ onNavigate }) {
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [isLoadingFaceStatus, setIsLoadingFaceStatus] = useState(true);
  const [isSubmittingFace, setIsSubmittingFace] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (severity, message) => {
    setToastState({ open: true, severity, message });
  };

  const loadFaceStatus = async () => {
    try {
      setIsLoadingFaceStatus(true);
      const status = await fetchFaceRegisterStatus();
      setIsFaceRegistered(Boolean(status.is_registered));
    } catch (error) {
      setIsFaceRegistered(false);
      showToast("error", getJapaneseErrorMessage(error, "顔登録状況の取得に失敗しました。"));
    } finally {
      setIsLoadingFaceStatus(false);
    }
  };

  const handleRegisterFace = async ({ content, extensionType }) => {
    try {
      setIsSubmittingFace(true);
      await registerFace({ content, extensionType });
      setIsFaceRegistered(true);
      showToast("success", "顔画像を登録しました。");
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "顔画像の登録に失敗しました。"));
      throw error;
    } finally {
      setIsSubmittingFace(false);
    }
  };

  const handleUpdateFace = async ({ content, extensionType }) => {
    try {
      setIsSubmittingFace(true);
      await updateFace({ content, extensionType });
      setIsFaceRegistered(true);
      showToast("success", "顔画像を更新しました。");
    } catch (error) {
      showToast("error", getJapaneseErrorMessage(error, "顔画像の更新に失敗しました。"));
      throw error;
    } finally {
      setIsSubmittingFace(false);
    }
  };

  useEffect(() => {
    loadFaceStatus();
    // プロトタイプ API はユーザー 104 のみ対応しているため、顔登録情報は初回だけ読み込みます。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionDisabled = isLoadingFaceStatus || isSubmittingFace;

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} className="wallet-header">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            顔登録
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User ID {USER_ID}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => onNavigate("home")}>
            ユーザー情報へ戻る
          </Button>
        </Stack>
      </Stack>

      {!isLoadingFaceStatus ? (
        <Alert severity={isFaceRegistered ? "success" : "info"} variant="outlined">
          {isFaceRegistered ? "顔画像は登録済みです。" : "登録済みの顔画像はまだありません。"}
        </Alert>
      ) : null}

      {!isLoadingFaceStatus ? (
        <FaceRegisterCard
          isRegistered={isFaceRegistered}
          isSubmitting={isSubmittingFace}
          actionDisabled={actionDisabled}
          onRegisterFace={handleRegisterFace}
          onUpdateFace={handleUpdateFace}
        />
      ) : null}

      <AppSnackbar
        toastState={toastState}
        onClose={() => setToastState((current) => ({ ...current, open: false }))}
      />

      <Backdrop open={actionDisabled} sx={{ color: "#fff", zIndex: (muiTheme) => muiTheme.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

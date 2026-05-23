import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Alert, Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { getJapaneseErrorMessage } from "../utils/api";

const OUTPUT_SIZE = 112;
const MAX_BASE64_LENGTH = 5000;
const MIN_CROP_SIZE = 48;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInitialCropBox(bounds) {
  const maxSide = Math.min(bounds.width, bounds.height);
  const side = clamp(maxSide * 0.55, MIN_CROP_SIZE, maxSide);

  return {
    x: (bounds.width - side) / 2,
    y: (bounds.height - side) / 2,
    size: side,
  };
}

async function imageSourceFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像ファイルの読み込みに失敗しました。"));
    reader.readAsDataURL(file);
  });
}

async function imageFromSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = source;
  });
}

function encodeJpegUnderLimit(canvas) {
  const qualities = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.28];

  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1] || "";
    if (base64.length <= MAX_BASE64_LENGTH) {
      return base64;
    }
  }

  throw new Error(`切り出した画像サイズが上限を超えています。${OUTPUT_SIZE} x ${OUTPUT_SIZE} のJPEG画像を${MAX_BASE64_LENGTH}文字以内にできませんでした。`);
}

export default function FaceRegisterCard({ isRegistered, isSubmitting, actionDisabled, onRegisterFace, onUpdateFace }) {
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const streamRef = useRef(null);
  const dragStateRef = useRef(null);

  const [imageSource, setImageSource] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cropBox, setCropBox] = useState(null);
  const [previewSource, setPreviewSource] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const resetCrop = (source) => {
    setImageSource(source);
    setCropBox(null);
    setPreviewSource("");
    setErrorMessage("");
  };

  const resetScreen = () => {
    stopCamera();
    dragStateRef.current = null;
    setImageSource("");
    setCropBox(null);
    setPreviewSource("");
    setErrorMessage("");
  };

  const startCamera = async () => {
    try {
      setErrorMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      setErrorMessage("カメラを起動できませんでした。ブラウザのカメラ権限を確認してください。");
    }
  };

  const captureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    resetCrop(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("画像ファイルを選択してください。");
      return;
    }

    try {
      resetCrop(await imageSourceFromFile(file));
      stopCamera();
    } catch (error) {
      setErrorMessage(getJapaneseErrorMessage(error, "画像ファイルの読み込みに失敗しました。"));
    }
  };

  const handleImageLoad = () => {
    if (!imageRef.current) return;
    setCropBox(getInitialCropBox(imageRef.current.getBoundingClientRect()));
  };

  const pointerPosition = (event) => {
    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
      bounds: rect,
    };
  };

  const startCropDrag = (mode) => (event) => {
    if (!imageRef.current || !cropBox || actionDisabled) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const position = pointerPosition(event);
    dragStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startPointer: { x: position.x, y: position.y },
      startBox: cropBox,
    };
    setPreviewSource("");
  };

  const handleCropPointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !imageRef.current) return;

    const position = pointerPosition(event);
    const dx = position.x - dragState.startPointer.x;
    const dy = position.y - dragState.startPointer.y;
    const { startBox } = dragState;

    if (dragState.mode === "move") {
      setCropBox({
        ...startBox,
        x: clamp(startBox.x + dx, 0, position.bounds.width - startBox.size),
        y: clamp(startBox.y + dy, 0, position.bounds.height - startBox.size),
      });
      return;
    }

    const maxSize = Math.min(position.bounds.width - startBox.x, position.bounds.height - startBox.y);
    const nextSize = clamp(startBox.size + Math.max(dx, dy), MIN_CROP_SIZE, maxSize);
    setCropBox({ ...startBox, size: nextSize });
  };

  const stopCropDrag = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
  };

  const createCroppedImage = async () => {
    if (!imageSource || !cropBox || !imageRef.current) {
      throw new Error("画像上の枠を調整して登録範囲を指定してください。");
    }

    const image = await imageFromSource(imageSource);
    const displayed = imageRef.current.getBoundingClientRect();
    const scaleX = image.naturalWidth / displayed.width;
    const scaleY = image.naturalHeight / displayed.height;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    context.drawImage(
      image,
      cropBox.x * scaleX,
      cropBox.y * scaleY,
      cropBox.size * scaleX,
      cropBox.size * scaleY,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    const content = encodeJpegUnderLimit(canvas);
    setPreviewSource(`data:image/jpeg;base64,${content}`);
    return content;
  };

  const handleSubmit = async () => {
    try {
      setErrorMessage("");
      const content = await createCroppedImage();
      if (isRegistered) {
        await onUpdateFace({ content, extensionType: "jpeg" });
      } else {
        await onRegisterFace({ content, extensionType: "jpeg" });
      }
      resetScreen();
    } catch (error) {
      setErrorMessage(getJapaneseErrorMessage(error, "顔画像の保存に失敗しました。"));
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, px: 3, py: 2 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            顔認証画像
          </Typography>
          <Typography variant="body2" color="text.secondary">
            カメラまたは画像アップロードから登録画像を用意し、枠を移動または右下のハンドルで拡大縮小して範囲を指定します。
          </Typography>
        </Stack>
        <Divider />

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CameraAltRoundedIcon />}
                onClick={startCamera}
                disabled={actionDisabled || isCameraActive}
              >
                カメラを起動
              </Button>
              <Button variant="outlined" startIcon={<UploadFileRoundedIcon />} component="label" disabled={actionDisabled}>
                画像を選択
                <input hidden type="file" accept="image/*" onChange={handleUpload} />
              </Button>
              {isCameraActive ? (
                <Button variant="outlined" color="inherit" startIcon={<StopCircleRoundedIcon />} onClick={stopCamera}>
                  停止
                </Button>
              ) : null}
            </Stack>

            <Box className="face-camera-box" sx={{ display: isCameraActive ? "block" : "none" }}>
              <video ref={videoRef} className="face-camera-video" autoPlay playsInline muted />
              <Button
                className="face-camera-capture"
                variant="contained"
                startIcon={<CameraAltRoundedIcon />}
                onClick={captureCameraFrame}
                disabled={actionDisabled}
              >
                撮影
              </Button>
            </Box>

            <Box className="face-crop-area">
              {imageSource ? (
                <Box className="face-crop-frame">
                  <img
                    ref={imageRef}
                    src={imageSource}
                    alt="切り出し対象"
                    className="face-crop-image"
                    draggable={false}
                    onLoad={handleImageLoad}
                  />
                  {cropBox ? (
                    <Box
                      className="face-crop-box"
                      onPointerDown={startCropDrag("move")}
                      onPointerMove={handleCropPointerMove}
                      onPointerUp={stopCropDrag}
                      onPointerCancel={stopCropDrag}
                      sx={{
                        left: cropBox.x,
                        top: cropBox.y,
                        width: cropBox.size,
                        height: cropBox.size,
                      }}
                    >
                      <Box
                        className="face-crop-resize-handle"
                        onPointerDown={startCropDrag("resize")}
                        onPointerMove={handleCropPointerMove}
                        onPointerUp={stopCropDrag}
                        onPointerCancel={stopCropDrag}
                      />
                    </Box>
                  ) : null}
                </Box>
              ) : (
                <Stack className="face-crop-placeholder" spacing={1}>
                  <CropFreeRoundedIcon color="disabled" />
                  <Typography variant="body2" color="text.secondary">
                    撮影またはアップロード後、画像上に初期枠が表示されます。
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          <Stack spacing={1.5} sx={{ width: { xs: "100%", md: 180 } }}>
            <Typography variant="caption" color="text.secondary">
              登録プレビュー
            </Typography>
            <Box className="face-preview-box">
              {previewSource ? <img src={previewSource} alt="登録プレビュー" /> : <Typography variant="caption">112 x 112</Typography>}
            </Box>
            <Button
              variant="contained"
              startIcon={isRegistered ? <EditRoundedIcon /> : <PersonAddAltRoundedIcon />}
              onClick={handleSubmit}
              disabled={actionDisabled || !imageSource || !cropBox}
              sx={{ fontWeight: 800 }}
            >
              {isSubmitting ? (isRegistered ? "更新中..." : "登録中...") : isRegistered ? "顔画像を更新" : "顔画像を登録"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

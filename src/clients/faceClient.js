import { API_URL, USER_ID } from "../config/appConfig";
import { extractErrorMessage, readJson } from "../utils/api";

async function requestJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const responseJson = await readJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(responseJson, response.status));
  }

  return responseJson;
}

export async function registerFace({ content, extensionType = "jpeg" }) {
  const responseJson = await requestJson("/face/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: USER_ID,
      content,
      extension_type: extensionType,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("顔画像の登録に失敗しました。");
  }

  return responseJson.data;
}

export async function fetchFaceRegisterStatus() {
  const responseJson = await requestJson(`/face/${USER_ID}`);

  if (!responseJson || responseJson.status !== "success" || !responseJson.data) {
    throw new Error("顔登録状況の取得に失敗しました。");
  }

  return responseJson.data;
}

export async function updateFace({ content, extensionType = "jpeg" }) {
  const responseJson = await requestJson("/face/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: USER_ID,
      content,
      extension_type: extensionType,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("顔画像の更新に失敗しました。");
  }

  return responseJson.data;
}

export async function deleteFace() {
  const responseJson = await requestJson("/face/", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: USER_ID,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("顔画像の削除に失敗しました。");
  }

  return responseJson.data;
}

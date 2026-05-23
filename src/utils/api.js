export async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function translateValidationMessage(message) {
  const atMostCharactersMatch = message.match(/^String should have at most (\d+) characters$/);
  if (atMostCharactersMatch) {
    return `文字数は${atMostCharactersMatch[1]}文字以下にしてください。`;
  }

  const atLeastCharactersMatch = message.match(/^String should have at least (\d+) characters$/);
  if (atLeastCharactersMatch) {
    return `文字数は${atLeastCharactersMatch[1]}文字以上にしてください。`;
  }

  if (message === "Field required") return "必須項目が入力されていません。";
  if (message === "Input should be a valid integer") return "整数を入力してください。";
  if (message === "Input should be a valid number") return "数値を入力してください。";
  if (message === "Input should be a valid boolean") return "真偽値を入力してください。";
  if (message === "Input should be a valid string") return "文字列を入力してください。";
  if (message === "Input should be a valid dictionary or object to extract fields from") {
    return "入力形式が不正です。";
  }

  return translateExternalErrorMessage(message, "入力内容が不正です。");
}

export function translateExternalErrorMessage(message, fallbackMessage = "エラーが発生しました。") {
  if (typeof message !== "string" || !message.trim()) return fallbackMessage;

  const normalizedMessage = message.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  if (lowerMessage.includes("user rejected") || lowerMessage.includes("user denied")) {
    return "ウォレットでの操作がキャンセルされました。";
  }
  if (lowerMessage.includes("insufficient funds")) {
    return "残高が不足しています。";
  }
  if (lowerMessage.includes("network") && (lowerMessage.includes("error") || lowerMessage.includes("failed"))) {
    return "ネットワークエラーが発生しました。通信状態を確認してください。";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "処理がタイムアウトしました。時間をおいて再度お試しください。";
  }
  if (lowerMessage.includes("failed to fetch")) {
    return "APIとの通信に失敗しました。";
  }
  if (lowerMessage.includes("invalid address")) {
    return "ウォレットアドレスの形式が不正です。";
  }
  if (lowerMessage.includes("chain mismatch") || lowerMessage.includes("wrong network")) {
    return "接続中のネットワークが正しくありません。";
  }
  if (lowerMessage.includes("execution reverted") || lowerMessage.includes("reverted")) {
    return "トランザクションがブロックチェーン上で失敗しました。";
  }
  if (lowerMessage.includes("request failed")) {
    return "リクエストに失敗しました。";
  }

  if ([...normalizedMessage].every((character) => character.charCodeAt(0) <= 0x7f)) {
    return fallbackMessage;
  }

  return normalizedMessage;
}

export function getJapaneseErrorMessage(error, fallbackMessage = "エラーが発生しました。") {
  if (error instanceof Error) {
    return translateExternalErrorMessage(error.message, fallbackMessage);
  }

  if (typeof error === "string") {
    return translateExternalErrorMessage(error, fallbackMessage);
  }

  return fallbackMessage;
}

export function extractErrorMessage(responseJson, status) {
  if (
    responseJson &&
    typeof responseJson === "object" &&
    responseJson.detail &&
    typeof responseJson.detail === "object" &&
    typeof responseJson.detail.message === "string"
  ) {
    return translateExternalErrorMessage(responseJson.detail.message, defaultMessageForStatus(status));
  }

  if (responseJson && typeof responseJson === "object" && Array.isArray(responseJson.detail)) {
    const validationMessages = responseJson.detail
      .map((detail) => (detail && typeof detail === "object" && typeof detail.msg === "string" ? translateValidationMessage(detail.msg) : ""))
      .filter(Boolean);

    if (validationMessages.length > 0) {
      return `入力内容が不正です。${validationMessages.join(" / ")}`;
    }
  }

  return defaultMessageForStatus(status);
}

function defaultMessageForStatus(status) {
  if (status === 400) return "リクエスト内容が不正です。";
  if (status === 401) return "認証が必要です。";
  if (status === 403) return "この操作を行う権限がありません。";
  if (status === 404) return "対象のデータが見つかりません。";
  if (status === 409) return "すでに登録済み、または現在の状態では操作できません。";
  if (status === 422) return "入力内容が不正です。";
  if (status >= 500) return "サーバーエラーが発生しました。";

  return `APIリクエストに失敗しました。HTTP ${status}`;
}

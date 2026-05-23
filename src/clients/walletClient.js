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

export async function fetchWallet() {
  const responseJson = await requestJson(`/user/${USER_ID}/wallet`);

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("ウォレット情報の取得に失敗しました。");
  }

  return responseJson.data;
}

export async function fetchWalletApproval() {
  const responseJson = await requestJson(`/user/${USER_ID}/wallet/approval`);

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("承認情報の取得に失敗しました。");
  }

  return responseJson.data;
}

export async function issueWalletNonce({ walletAddress, chainType, networkName }) {
  const responseJson = await requestJson(`/user/${USER_ID}/wallet/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      chain_type: chainType,
      network_name: networkName,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("署名用コードの発行に失敗しました。");
  }

  return responseJson.data.nonce;
}

export async function registerWallet({ walletAddress, signature, network }) {
  const responseJson = await requestJson(`/user/${USER_ID}/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature,
      chain_type: network.chainType,
      network_name: network.networkName,
      token_symbol: network.tokenSymbol,
      chain_id: network.chainId,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("ウォレット登録に失敗しました。");
  }

  return responseJson.data;
}

export async function deleteWallet(walletId) {
  await requestJson(`/user/${USER_ID}/wallet/${walletId}`, {
    method: "DELETE",
  });
}

export async function markWalletApproved(walletId, txHash) {
  const responseJson = await requestJson(`/user/${USER_ID}/wallet/${walletId}/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_hash: txHash,
    }),
  });

  if (!responseJson || responseJson.status !== "success") {
    throw new Error("承認状態の更新に失敗しました。");
  }

  return responseJson.data;
}

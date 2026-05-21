export async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function extractErrorMessage(responseJson, status) {
  if (
    responseJson &&
    typeof responseJson === "object" &&
    responseJson.detail &&
    typeof responseJson.detail === "object" &&
    typeof responseJson.detail.message === "string"
  ) {
    return responseJson.detail.message;
  }

  return `API request failed. HTTP ${status}`;
}

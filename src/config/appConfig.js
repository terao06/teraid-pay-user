export const USER_ID = 104;

export const DEFAULT_WALLET_NETWORK = {
  chainType: "ethereum",
  networkName: "sepolia",
};

export const API_URL = (process.env.REACT_APP_TERAID_PAY_API || "http://localhost:8005").replace(/\/$/, "");

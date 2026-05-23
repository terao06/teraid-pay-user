import {
  Box,
  Container,
  CssBaseline,
  Stack,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

import "./App.css";
import FaceRegisterPage from "./pages/FaceRegisterPage";
import HomePage from "./pages/HomePage";
import WalletPage from "./pages/WalletPage";
import { Web3Providers } from "./Web3Providers";

const theme = createTheme({
  palette: {
    primary: {
      main: "#256f67",
    },
    secondary: {
      main: "#9a3412",
    },
    background: {
      default: "#f4f7f6",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

function getPageFromPath(pathname) {
  if (pathname === "/wallet") return "wallet";
  if (pathname === "/face") return "face";
  return "home";
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page) => {
    const path = page === "wallet" ? "/wallet" : page === "face" ? "/face" : "/";
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
    setCurrentPage(page);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Providers>
        <Box className="wallet-page">
          <Container maxWidth="lg">
            <Stack spacing={3}>
              {currentPage === "wallet" ? (
                <WalletPage onNavigate={navigateTo} />
              ) : currentPage === "face" ? (
                <FaceRegisterPage onNavigate={navigateTo} />
              ) : (
                <HomePage onNavigate={navigateTo} />
              )}
            </Stack>
          </Container>
        </Box>
      </Web3Providers>
    </ThemeProvider>
  );
}

export default App;

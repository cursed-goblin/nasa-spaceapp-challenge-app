import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import App from "./App";
import { GameProvider } from "./state/GameContext";
import { ToastProvider } from "./components/ui/Toast";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </GameProvider>
  </StrictMode>,
);

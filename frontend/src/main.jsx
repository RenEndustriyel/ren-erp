import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";

import "./styles/theme.css";

function installRenSuccessToast() {
  if (window.__REN_SUCCESS_TOAST_INSTALLED__) return;
  window.__REN_SUCCESS_TOAST_INSTALLED__ = true;

  const nativeAlert = window.alert.bind(window);

  window.alert = (message) => {
    const text = String(message ?? "");
    const successWords = [
      "kaydedildi",
      "kaydedildi.",
      "başarıyla kaydedildi",
      "başarıyla kaydedildi.",
      "içe aktarıldı",
      "içeri aktarıldı",
      "oluşturuldu",
      "güncellendi",
      "silindi",
    ];

    const isSuccess = successWords.some((word) =>
      text.toLocaleLowerCase("tr-TR").includes(word)
    );

    if (!isSuccess) {
      nativeAlert(message);
      return;
    }

    let root = document.getElementById("ren-global-toast-root");

    if (!root) {
      root = document.createElement("div");
      root.id = "ren-global-toast-root";
      root.style.position = "fixed";
      root.style.top = "76px";
      root.style.right = "24px";
      root.style.zIndex = "2147483647";
      root.style.display = "grid";
      root.style.gap = "10px";
      root.style.pointerEvents = "none";
      document.body.appendChild(root);
    }

    const toast = document.createElement("div");
    toast.textContent = text;
    toast.style.minWidth = "280px";
    toast.style.maxWidth = "420px";
    toast.style.padding = "12px 15px";
    toast.style.border = "1px solid #2f8f69";
    toast.style.borderRadius = "10px";
    toast.style.background = "#173c31";
    toast.style.color = "#d9f8e8";
    toast.style.boxShadow = "0 12px 30px rgba(0,0,0,.28)";
    toast.style.font = '600 12px Inter, "Segoe UI", Arial, sans-serif';
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    toast.style.transition = "opacity .18s ease, transform .18s ease";
    toast.style.pointerEvents = "none";

    root.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      window.setTimeout(() => toast.remove(), 180);
    }, 2600);
  };
}

if (typeof window !== "undefined") {
  installRenSuccessToast();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

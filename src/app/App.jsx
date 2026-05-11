import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./shell/ErrorBoundary.jsx";
import AppShell from "./shell/AppShell.jsx";
import AuthCallbackPage from "./pages/AuthCallbackPage.jsx";
import "../shared/styles/global.css";

export default function App() {
  React.useEffect(() => {
    if (!document.getElementById("placeholder-style")) {
      const s = document.createElement("style");
      s.id = "placeholder-style";
      s.textContent = "@keyframes slideUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } } input::placeholder,textarea::placeholder { }";
      document.head.appendChild(s);
    }
  }, []);
  return <ErrorBoundary><BrowserRouter><Routes><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="*" element={<AppShell />} /></Routes></BrowserRouter></ErrorBoundary>;
}

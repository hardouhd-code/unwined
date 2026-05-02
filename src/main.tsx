import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Enregistrement PWA (sans forcer le rechargement brutal qui cause des boucles infinies)
registerSW({ immediate: true });


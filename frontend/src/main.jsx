import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { KeybindingsProvider } from "./context/KeybindingsContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <KeybindingsProvider>
      <App />
    </KeybindingsProvider>
  </React.StrictMode>
);
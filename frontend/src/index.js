// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import { AIModeProvider } from "./context/AIModeContext";
import { DemoModeProvider } from "./context/DemoModeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AIModeProvider>
        <DemoModeProvider>
          <App />
        </DemoModeProvider>
      </AIModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "woi_active_ai_mode_v1"; // fast | deep | master

const AIModeContext = createContext(null);

export const AIModeProvider = ({ children }) => {
  const [aiMode, setAiModeState] = useState("fast");

  // load once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "fast" || saved === "deep" || saved === "master") {
        setAiModeState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setAiMode = (mode) => {
    const next = mode === "deep" || mode === "master" ? mode : "fast";
    setAiModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
  };

  const value = useMemo(() => ({ aiMode, setAiMode }), [aiMode]);

  return <AIModeContext.Provider value={value}>{children}</AIModeContext.Provider>;
};

export const useAIMode = () => {
  const ctx = useContext(AIModeContext);
  if (!ctx) throw new Error("useAIMode must be used within AIModeProvider");
  return ctx;
};

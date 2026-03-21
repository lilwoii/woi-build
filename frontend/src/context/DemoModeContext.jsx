import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Demo Mode
 * - When ON: UI simulates activity so new users can SEE the system working instantly.
 * - Stored in localStorage so it persists across refreshes.
 */
const DemoModeContext = createContext(null);

export const DemoModeProvider = ({ children }) => {
  const [demoMode, setDemoMode] = useState(() => {
    try {
      const raw = localStorage.getItem("woi_demo_mode");
      return raw === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("woi_demo_mode", String(demoMode));
    } catch {
      // ignore
    }
  }, [demoMode]);

  const value = useMemo(() => ({ demoMode, setDemoMode }), [demoMode]);
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
};

export const useDemoMode = () => {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
};

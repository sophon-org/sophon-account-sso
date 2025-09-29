"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const MODES = ["sophon", "connectkit", "rainbowkit", "walletconnect"] as const;
export type ConnectMode = (typeof MODES)[number];

type Ctx = { mode: ConnectMode; setMode: (m: ConnectMode) => void };

const STORAGE_KEY = "demoMode";
const ConnectModeContext = createContext<Ctx>({ mode: "sophon", setMode: () => {} });

export function ConnectModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ConnectMode>(() => {
    if (typeof window === "undefined") return "sophon";

    const saved = localStorage.getItem(STORAGE_KEY);

    return typeof saved === "string" && (MODES as readonly string[]).includes(saved)
      ? (saved as ConnectMode)
      : "sophon";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ConnectModeContext.Provider value={value}>{children}</ConnectModeContext.Provider>;
}

export function useConnectMode() {
  return useContext(ConnectModeContext);
}

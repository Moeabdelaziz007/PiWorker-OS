"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Script from "next/script";

interface User {
  username: string;
  uid: string;
}

interface PiContextType {
  isInitialized: boolean;
  error: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
}

const PiContext = createContext<PiContextType | undefined>(undefined);

export const PiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const initPi = () => {
    try {
      if (typeof window !== "undefined" && (window as any).Pi) {
        (window as any).Pi.init({ version: "2.0", sandbox: true });
        setIsInitialized(true);
        console.log("%c[PI_SDK] Sovereign Initialization Complete (Sandbox Mode)", "color: #39FF14; font-weight: bold;");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("[PI_SDK] Initialization Failed:", err);
    }
  };

  return (
    <PiContext.Provider value={{ isInitialized, error, user, setUser }}>
      <Script
        src="https://sdk.minepi.com/pi-sdk.js"
        onLoad={initPi}
        onError={() => setError("Failed to load Pi SDK script")}
      />
      {children}
    </PiContext.Provider>
  );
};

export const usePi = () => {
  const context = useContext(PiContext);
  if (context === undefined) {
    throw new Error("usePi must be used within a PiProvider");
  }
  return context;
};

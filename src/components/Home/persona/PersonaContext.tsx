import React, { createContext, useContext, useState, useMemo } from "react";
import type { Persona } from "./personaContent";

import type { BrandMode } from "./brandHeroData";

interface PersonaContextValue {
  persona: Persona;
  setPersona: (persona: Persona) => void;
  togglePersona: () => void;
  brandMode: BrandMode;
  setBrandMode: (mode: BrandMode) => void;
  toggleBrandMode: () => void;
  hasInteractedBrandPill: boolean;
  setHasInteractedBrandPill: (val: boolean) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersona] = useState<Persona>("creator");
  const [brandMode, setBrandMode] = useState<BrandMode>("traditional");
  const [hasInteractedBrandPill, setHasInteractedBrandPill] = useState<boolean>(false);

  const value = useMemo<PersonaContextValue>(
    () => ({
      persona,
      setPersona,
      togglePersona: () => setPersona((prev) => (prev === "creator" ? "brand" : "creator")),
      brandMode,
      setBrandMode,
      toggleBrandMode: () => setBrandMode((prev) => (prev === "traditional" ? "sellr" : "traditional")),
      hasInteractedBrandPill,
      setHasInteractedBrandPill,
    }),
    [persona, brandMode, hasInteractedBrandPill]
  );

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
};

export const usePersona = (): PersonaContextValue => {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return ctx;
};

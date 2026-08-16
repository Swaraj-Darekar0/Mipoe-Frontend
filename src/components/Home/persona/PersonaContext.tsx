import React, { createContext, useContext, useState, useMemo } from "react";
import type { Persona } from "./personaContent";

interface PersonaContextValue {
  persona: Persona;
  setPersona: (persona: Persona) => void;
  togglePersona: () => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersona] = useState<Persona>("creator");

  const value = useMemo<PersonaContextValue>(
    () => ({
      persona,
      setPersona,
      togglePersona: () => setPersona((prev) => (prev === "creator" ? "brand" : "creator")),
    }),
    [persona]
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

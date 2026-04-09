import React, { createContext, useContext, useState, useEffect } from "react";
import { KEYBINDING_LAYOUTS } from "../constants/keybindings";

const KeybindingsContext = createContext();

export function KeybindingsProvider({ children }) {
  const [currentLayout, setCurrentLayout] = useState("QWERTY");
  const [customKeybindings, setCustomKeybindings] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem("customKeybindings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return KEYBINDING_LAYOUTS.QWERTY;
      }
    }
    return KEYBINDING_LAYOUTS.QWERTY;
  });

  // Save to localStorage whenever keybindings change
  useEffect(() => {
    localStorage.setItem("customKeybindings", JSON.stringify(customKeybindings));
  }, [customKeybindings]);

  const switchLayout = (layoutName) => {
    if (KEYBINDING_LAYOUTS[layoutName]) {
      setCurrentLayout(layoutName);
      setCustomKeybindings(KEYBINDING_LAYOUTS[layoutName]);
    }
  };

  const updateKeybinding = (action, key) => {
    setCustomKeybindings((prev) => ({
      ...prev,
      [action]: key,
    }));
  };

  const getKeybinding = (action) => {
    return customKeybindings[action] || null;
  };

  const resetToDefault = () => {
    setCurrentLayout("QWERTY");
    setCustomKeybindings(KEYBINDING_LAYOUTS.QWERTY);
  };

  return (
    <KeybindingsContext.Provider
      value={{
        currentLayout,
        customKeybindings,
        switchLayout,
        updateKeybinding,
        getKeybinding,
        resetToDefault,
      }}
    >
      {children}
    </KeybindingsContext.Provider>
  );
}

export function useKeybindings() {
  const context = useContext(KeybindingsContext);
  if (!context) {
    throw new Error("useKeybindings must be used within KeybindingsProvider");
  }
  return context;
}

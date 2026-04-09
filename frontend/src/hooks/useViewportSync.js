import { useEffect } from "react";

export function useViewportSync({ viewportApiRef, activeTab }) {
  useEffect(() => {
    const api = viewportApiRef.current;
    if (!api) return;
    api.setRunning(activeTab === "viewport");
  }, [activeTab, viewportApiRef]);
}
import { FOCUS_FALLBACK_DELAY } from "../constants/appConstants";

export function delay(ms = FOCUS_FALLBACK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMaybeAsync(action, fallbackMs = FOCUS_FALLBACK_DELAY) {
  try {
    const result = action?.();

    if (result && typeof result.then === "function") {
      await result;
    } else {
      await delay(fallbackMs);
    }
  } catch {
    await delay(fallbackMs);
  }
}
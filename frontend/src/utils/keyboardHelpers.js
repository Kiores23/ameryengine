/**
 * Helper to strictly match a binding with the current key press
 * If binding requires CTRL+, then ONLY Ctrl+key triggers it
 * If binding is just a key, then ONLY that key without Ctrl triggers it
 */
export function matchesBinding(binding, currentKey, hasCtrl, hasShift) {
  if (!binding) return false;

  // Check if binding requires Ctrl
  const requiresCtrl = binding.includes("CTRL+");
  const requiresShift = binding.includes("SHIFT+");

  // Extract the actual key (without CTRL+ or SHIFT+ prefix)
  const bindingKey = binding
    .replace("CTRL+", "")
    .replace("SHIFT+", "");

  // If binding requires Ctrl but user didn't press Ctrl, no match
  if (requiresCtrl && !hasCtrl) return false;
  // If binding doesn't require Ctrl but user pressed Ctrl, no match (strict)
  if (!requiresCtrl && hasCtrl) return false;

  // If binding requires Shift but user didn't press Shift, no match
  if (requiresShift && !hasShift) return false;
  // If binding doesn't require Shift but user pressed Shift, no match (strict)
  if (!requiresShift && hasShift) return false;

  // Check if the key matches
  return bindingKey === currentKey;
}

/**
 * Normalize a key from event to uppercase, handling special cases like Space
 */
export function normalizeEventKey(eventKey) {
  if (eventKey === " ") return "Space";
  return eventKey.toUpperCase();
}

/**
 * Check if user is typing in an input field
 */
export function isTypingInField() {
  const el = document.activeElement;
  const tag = el?.tagName?.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    el?.isContentEditable
  );
}

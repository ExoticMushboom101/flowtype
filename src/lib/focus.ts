// Focus helpers shared by the shell and the practice page.

/** Programmatic focus on touch devices would pop the on-screen keyboard unexpectedly. */
export const finePointer = () =>
  typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;

/** Nothing meaningful has focus: body, the root, or the <main> landmark. */
export const isIdleTarget = (target: EventTarget | null) =>
  !target ||
  target === document.body ||
  target === document.documentElement ||
  (target instanceof HTMLElement && target.id === "main");

/**
 * Buttons and links never consume printable characters, so a letter typed while
 * one is focused (e.g. right after toggling the theme) is meant for the passage.
 * Inputs, selects, textareas and editable regions are never redirected.
 */
export const redirectable = (target: EventTarget | null) =>
  isIdleTarget(target) ||
  (target instanceof HTMLElement &&
    target.matches("button, a[href]") &&
    !target.closest("dialog"));

/**
 * Module-level flag tracking whether the intro has played during the
 * current JS module lifetime. Survives client-side nav (same module
 * instance), resets on hard reload (new module instance). Exactly the
 * "every page load" semantics we want.
 */
export const introState = {
  hasPlayed: false,
};

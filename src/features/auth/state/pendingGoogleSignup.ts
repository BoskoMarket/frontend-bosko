/**
 * Holds the Firebase ID token of a NEW Google user while they pick a city and accept the
 * terms (the backend answered 422 CITY_REQUIRED). Memory only: never persisted, cleared as
 * soon as the retry succeeds or the user leaves the flow. Not a store: nothing subscribes.
 */
let pendingToken: string | null = null;

export const pendingGoogleSignup = {
  set(token: string): void { pendingToken = token; },
  get(): string | null { return pendingToken; },
  clear(): void { pendingToken = null; },
};

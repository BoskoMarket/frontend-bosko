/**
 * Postponed to the next version: flip a flag to `true` to re-enable it everywhere.
 * - `reels`: the video feed and its publishing flows.
 * - `payments`: in-app checkout, payment receipts and subscription plans. In v1 the
 *   client pays the provider directly, outside the app.
 */
export const FEATURES = { reels: false, payments: false } as const;

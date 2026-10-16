import { useEffect, useState } from 'react';

export const BOOT_MIN_MS = 600;
export const BOOT_CONFIG_TIMEOUT_MS = 1500;

interface BootReadyInput {
  /** Session restore finished (AuthContext.authLoaded). */
  authLoaded: boolean;
  /** First app-config (maintenance / min version) fetch settled, success or not. */
  configSettled: boolean;
}

/**
 * True when the boot splash may leave: the session is restored, the first
 * app-config check settled (or 1.5s passed — it fails open) and the splash has
 * been visible for at least 600ms, so a fast start never flashes it.
 */
export function useBootReady({ authLoaded, configSettled }: BootReadyInput): boolean {
  const [minElapsed, setMinElapsed] = useState(false);
  const [configTimedOut, setConfigTimedOut] = useState(false);

  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), BOOT_MIN_MS);
    const cfg = setTimeout(() => setConfigTimedOut(true), BOOT_CONFIG_TIMEOUT_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(cfg);
    };
  }, []);

  return authLoaded && (configSettled || configTimedOut) && minElapsed;
}

import type { ReelsAutoplay } from '@/stores/preferences.store';

/**
 * Whether reels may start on their own. Only a known cellular connection
 * combined with the "wifi" preference blocks autoplay; an unknown or missing
 * connection type never blocks playback.
 */
export function shouldAutoplay(pref: ReelsAutoplay, connectionType: string | null | undefined): boolean {
  if (pref === 'always') return true;
  return connectionType !== 'cellular';
}

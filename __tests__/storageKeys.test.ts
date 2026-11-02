import { STORAGE_PREFIX } from '@/core/config/storage';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';
import { ROLE_MODAL_SEEN_KEY } from '@/features/servicesUser/components/RoleSelectionModal';
import { useAppLockStore } from '@/stores/appLock.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useThemeStore } from '@/stores/theme.store';

// Persisted keys must never change on a rebrand: they hold users' local data.
describe('storage keys', () => {
  it('keeps the prefix stable', () => {
    expect(STORAGE_PREFIX).toBe('BOSKO');
  });

  it('keeps exported key strings unchanged', () => {
    expect(WELCOME_VIDEO_PENDING_KEY).toBe('BOSKO_WELCOME_VIDEO_PENDING');
    expect(ROLE_MODAL_SEEN_KEY).toBe('BOSKO_ROLE_MODAL_SEEN');
  });

  it('keeps persisted store names unchanged', () => {
    expect(useAppLockStore.persist.getOptions().name).toBe('BOSKO_APP_LOCK_v1');
    expect(usePreferencesStore.persist.getOptions().name).toBe('BOSKO_PREFERENCES_v1');
    expect(useThemeStore.persist.getOptions().name).toBe('BOSKO_THEME_v1');
  });
});

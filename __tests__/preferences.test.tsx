import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useThemeStore } from '@/stores/theme.store';
import { shouldAutoplay } from '@/features/reels/utils/shouldAutoplay';
import { ReelsAutoplayRow } from '@/features/profile/components/ReelsAutoplayRow';

const reset = () => { act(() => { usePreferencesStore.setState({ reelsAutoplay: 'always' }); }); };

describe('preferences store', () => {
  beforeEach(reset);

  it('defaults reels autoplay to always', () => {
    expect(usePreferencesStore.getState().reelsAutoplay).toBe('always');
  });

  it('updates reels autoplay through the setter', () => {
    act(() => { usePreferencesStore.getState().setReelsAutoplay('wifi'); });
    expect(usePreferencesStore.getState().reelsAutoplay).toBe('wifi');
  });

  it('persists only data, never functions', () => {
    const partialize = usePreferencesStore.persist.getOptions().partialize!;
    const persisted = partialize(usePreferencesStore.getState());
    expect(persisted).toEqual({ reelsAutoplay: 'always' });
  });
});

describe('shouldAutoplay', () => {
  it.each([
    ['always', 'wifi', true],
    ['always', 'cellular', true],
    ['always', 'unknown', true],
    ['always', 'none', true],
    ['wifi', 'wifi', true],
    ['wifi', 'cellular', false],
    ['wifi', 'unknown', true],
    ['wifi', 'none', true],
    ['wifi', undefined, true],
  ] as const)('pref %s on %s -> %s', (pref, type, expected) => {
    expect(shouldAutoplay(pref, type)).toBe(expected);
  });
});

describe.each(['dark', 'light'] as const)('ReelsAutoplayRow (%s)', (mode) => {
  beforeEach(() => {
    reset();
    act(() => { useThemeStore.getState().setMode(mode); });
  });
  afterAll(() => { act(() => { useThemeStore.getState().setMode('dark'); }); });

  it('shows the current value and toggles it', () => {
    const { getByText, getByLabelText } = render(<ReelsAutoplayRow />);
    expect(getByText('Reproducción automática de reels')).toBeTruthy();
    expect(getByText('Siempre')).toBeTruthy();
    fireEvent(getByLabelText('Reproducir reels automáticamente solo con Wi-Fi'), 'valueChange', true);
    expect(getByText('Solo con Wi-Fi')).toBeTruthy();
    expect(usePreferencesStore.getState().reelsAutoplay).toBe('wifi');
    fireEvent(getByLabelText('Reproducir reels automáticamente solo con Wi-Fi'), 'valueChange', false);
    expect(getByText('Siempre')).toBeTruthy();
  });
});

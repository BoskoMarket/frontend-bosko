import React from 'react';
import { act, render } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import { BootSplash } from '@/core/design-system';
import { BOOT_CONFIG_TIMEOUT_MS, BOOT_MIN_MS, useBootReady } from '@/hooks/useBootReady';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('BootSplash', () => {
  it('stays visible while not ready and reports the first layout once', () => {
    const onHidden = jest.fn();
    const onFirstLayout = jest.fn();
    const ui = render(<BootSplash ready={false} onHidden={onHidden} onFirstLayout={onFirstLayout} />);
    const root = ui.getByLabelText('Cargando Bosko');
    act(() => {
      root.props.onLayout?.({ nativeEvent: { layout: { width: 1, height: 1, x: 0, y: 0 } } });
      root.props.onLayout?.({ nativeEvent: { layout: { width: 1, height: 1, x: 0, y: 0 } } });
    });
    act(() => { jest.advanceTimersByTime(2000); });
    expect(onFirstLayout).toHaveBeenCalledTimes(1);
    expect(onHidden).not.toHaveBeenCalled();
  });

  it('calls onHidden once after the exit animation when ready', () => {
    const onHidden = jest.fn();
    const ui = render(<BootSplash ready={false} onHidden={onHidden} />);
    ui.rerender(<BootSplash ready onHidden={onHidden} />);
    act(() => { jest.advanceTimersByTime(1500); });
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});

describe('useBootReady', () => {
  it('waits for auth, the minimum display time and the config check', () => {
    const { result, rerender } = renderHook((p: { authLoaded: boolean; configSettled: boolean }) => useBootReady(p), {
      initialProps: { authLoaded: true, configSettled: true },
    });
    expect(result.current).toBe(false);
    act(() => { jest.advanceTimersByTime(BOOT_MIN_MS); });
    expect(result.current).toBe(true);
    rerender({ authLoaded: false, configSettled: true });
    expect(result.current).toBe(false);
  });

  it('stops waiting for the app config after the timeout', () => {
    const { result } = renderHook(() => useBootReady({ authLoaded: true, configSettled: false }));
    act(() => { jest.advanceTimersByTime(BOOT_CONFIG_TIMEOUT_MS - 1); });
    expect(result.current).toBe(false);
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe(true);
  });
});

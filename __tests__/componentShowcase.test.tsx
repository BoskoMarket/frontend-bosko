import React from 'react';
import { render } from '@testing-library/react-native';
import { ComponentShowcase } from '@/core/design-system/showcase/ComponentShowcase';
import { useThemeStore } from '@/stores/theme.store';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ComponentShowcase', () => {
  it.each(['dark', 'light'] as const)('renders in %s theme', (mode) => {
    useThemeStore.setState({ mode });
    const { getByText } = render(<ComponentShowcase />);
    expect(getByText('Component showcase')).toBeTruthy();
    expect(getByText('Button')).toBeTruthy();
  });
});

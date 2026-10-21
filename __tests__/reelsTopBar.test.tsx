import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: any[]) => mockPush(...a) } }));

import { ReelsTopBar } from '@/features/reels/components/ReelsTopBar';
import { REEL_UPLOAD_ROUTE } from '@/features/reels/routes';

describe('ReelsTopBar', () => {
  beforeEach(() => mockPush.mockReset());

  it('shows the publish button to providers and opens the upload screen', () => {
    const { getByLabelText } = render(<ReelsTopBar insetTop={0} tab="parati" setTab={jest.fn()} canUpload />);
    fireEvent.press(getByLabelText('Publicar reel'));
    expect(mockPush).toHaveBeenCalledWith(REEL_UPLOAD_ROUTE);
  });

  it('hides the publish button for clients', () => {
    const { queryByLabelText } = render(<ReelsTopBar insetTop={0} tab="parati" setTab={jest.fn()} canUpload={false} />);
    expect(queryByLabelText('Publicar reel')).toBeNull();
  });

  it('switches feed tabs and keeps search', () => {
    const setTab = jest.fn();
    const { getByText, getByLabelText } = render(<ReelsTopBar insetTop={0} tab="parati" setTab={setTab} canUpload={false} />);
    fireEvent.press(getByText('Siguiendo'));
    expect(setTab).toHaveBeenCalledWith('siguiendo');
    fireEvent.press(getByLabelText('Buscar'));
    expect(mockPush).toHaveBeenCalledWith('/search');
  });
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CheckboxRow, Text } from '@/core/design-system';

describe('CheckboxRow', () => {
  it('toggles with the next value and exposes checkbox accessibility state', () => {
    const onToggle = jest.fn();
    const ui = render(<CheckboxRow checked={false} onToggle={onToggle}>Acepto</CheckboxRow>);
    const box = ui.getByRole('checkbox');
    expect(box.props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(box);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('reflects the checked state and shows the field error', () => {
    const onToggle = jest.fn();
    const ui = render(<CheckboxRow checked onToggle={onToggle} error="Obligatorio">Acepto</CheckboxRow>);
    expect(ui.getByRole('checkbox').props.accessibilityState).toMatchObject({ checked: true });
    expect(ui.getByText('Obligatorio')).toBeTruthy();
    fireEvent.press(ui.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('keeps a link inside the label tappable without toggling', () => {
    const onToggle = jest.fn();
    const onLink = jest.fn();
    const ui = render(
      <CheckboxRow checked={false} onToggle={onToggle} accessibilityLabel="Acepto los términos">
        <Text onPress={onLink}>términos</Text>
      </CheckboxRow>,
    );
    fireEvent.press(ui.getByText('términos'));
    expect(onLink).toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not toggle when disabled', () => {
    const onToggle = jest.fn();
    const ui = render(<CheckboxRow checked={false} onToggle={onToggle} disabled>Acepto</CheckboxRow>);
    fireEvent.press(ui.getByRole('checkbox'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

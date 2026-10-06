import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  AuthBackdrop,
  AuthCard,
  Avatar,
  BackButton,
  Button,
  Badge,
  Chip,
  Divider,
  EmptyState,
  Input,
  ListRow,
  OtpInput,
  SectionHeader,
  ToastRoot,
  toast,
} from '@/core/design-system';
import { Input as LegacyInput } from '@/core/components/Input';
import { EmptyState as LegacyEmptyState } from '@/core/components/EmptyState';
import { ToastRoot as LegacyToastRoot, toast as legacyToast } from '@/core/components/Toast';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('design system components', () => {
  it('Input renders label, error and fires onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <Input label="Email" error="Requerido" placeholder="tu@mail.com" leftIcon="mail-outline" onChangeText={onChangeText} />,
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Requerido')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('tu@mail.com'), 'a@b.c');
    expect(onChangeText).toHaveBeenCalledWith('a@b.c');
  });

  it('Input toggles password visibility', () => {
    const { getByLabelText, getByPlaceholderText } = render(<Input placeholder="pw" secureTextEntry />);
    expect(getByPlaceholderText('pw').props.secureTextEntry).toBe(true);
    fireEvent.press(getByLabelText('Mostrar contraseña'));
    expect(getByPlaceholderText('pw').props.secureTextEntry).toBe(false);
  });

  it('EmptyState renders copy and fires CTAs', () => {
    const onCta = jest.fn();
    const onSecondary = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon="file-tray-outline"
        title="Sin órdenes"
        subtitle="Todavía no tenés órdenes"
        cta={{ label: 'Explorar', onPress: onCta }}
        secondaryCta={{ label: 'Más tarde', onPress: onSecondary }}
      />,
    );
    expect(getByText('Sin órdenes')).toBeTruthy();
    fireEvent.press(getByText('Explorar'));
    fireEvent.press(getByText('Más tarde'));
    expect(onCta).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('Toast shows an alert enqueued via toast.success', () => {
    jest.useFakeTimers();
    const { queryByText, getByText } = render(<ToastRoot />);
    expect(queryByText('Guardado')).toBeNull();
    act(() => {
      toast.success('Guardado', 'Todo listo');
    });
    expect(getByText('Guardado')).toBeTruthy();
    expect(getByText('Todo listo')).toBeTruthy();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('old core/components paths still re-export the design-system components', () => {
    expect(LegacyInput).toBe(Input);
    expect(LegacyEmptyState).toBe(EmptyState);
    expect(LegacyToastRoot).toBe(ToastRoot);
    expect(legacyToast).toBe(toast);
  });

  it('Divider, SectionHeader render; SectionHeader action fires', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <>
        <Divider spacing="md" />
        <Divider vertical />
        <SectionHeader title="Destacados" onActionPress={onAction} />
      </>,
    );
    expect(getByText('Destacados')).toBeTruthy();
    fireEvent.press(getByText('Ver todo'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('Badge renders every lifecycle tone plus brand/neutral', () => {
    const tones = ['pending', 'accepted', 'progress', 'done', 'cancelled', 'brand', 'neutral'] as const;
    const { getByText } = render(
      <>
        {tones.map((t) => (
          <Badge key={t} label={`tone-${t}`} tone={t} icon="checkmark" size={t === 'neutral' ? 'sm' : 'md'} />
        ))}
      </>,
    );
    for (const t of tones) expect(getByText(`tone-${t}`)).toBeTruthy();
  });

  it('Chip toggles selected state and fires onPress', () => {
    const onPress = jest.fn();
    const { getByLabelText, rerender } = render(<Chip label="Plomería" onPress={onPress} />);
    fireEvent.press(getByLabelText('Plomería'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Plomería').props.accessibilityState).toMatchObject({ selected: false });
    rerender(<Chip label="Plomería" selected icon="water-outline" onPress={onPress} />);
    expect(getByLabelText('Plomería').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('Avatar shows the initial without a photo and an image with one', () => {
    const { getByText, rerender, queryByText } = render(<Avatar name="ana" />);
    expect(getByText('A')).toBeTruthy();
    rerender(<Avatar name="ana" uri="https://example.test/a.png" online />);
    expect(queryByText('A')).toBeNull();
  });

  it('OtpInput is controlled: typing a digit reports the joined code, paste fills all boxes', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<OtpInput value="12" onChange={onChange} length={6} label="Código" />);
    fireEvent.changeText(getByLabelText('Dígito 3 de 6'), '9');
    expect(onChange).toHaveBeenLastCalledWith('129');
    fireEvent.changeText(getByLabelText('Dígito 1 de 6'), '654321');
    expect(onChange).toHaveBeenLastCalledWith('654321');
    fireEvent.changeText(getByLabelText('Dígito 1 de 6'), 'x');
    expect(onChange).toHaveBeenLastCalledWith('2'); // non-digits are stripped, clearing box 1
  });

  it('AuthCard renders its children', () => {
    const { getByText } = render(
      <AuthCard>
        <Divider />
        <SectionHeader title="Iniciar sesión" />
      </AuthCard>,
    );
    expect(getByText('Iniciar sesión')).toBeTruthy();
  });

  it('AuthBackdrop renders children over the backdrop (themed and forced dark)', () => {
    const { getByText, rerender } = render(<AuthBackdrop><SectionHeader title="Hola" /></AuthBackdrop>);
    expect(getByText('Hola')).toBeTruthy();
    rerender(<AuthBackdrop forceDark tilt={-10} duration={1300}><SectionHeader title="Hola" /></AuthBackdrop>);
    expect(getByText('Hola')).toBeTruthy();
  });

  it('BackButton fires onPress', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<BackButton onPress={onPress} />);
    fireEvent.press(getByLabelText('Volver'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button places the icon on the requested side of the label', () => {
    const { getByTestId } = render(
      <>
        <Button label="A" icon={<Divider />} iconPosition="right" testID="btn-right" />
        <Button label="B" icon={<Divider />} testID="btn-left" />
      </>,
    );
    const kids = (id: string) => getByTestId(id).findAll((n) => typeof n.type === 'string').length;
    expect(kids('btn-right')).toBeGreaterThan(0);
    expect(kids('btn-left')).toBeGreaterThan(0);
  });

  it('ListRow renders label/subtitle and fires onPress; danger hides the chevron', () => {
    const onPress = jest.fn();
    const { getByText, getByLabelText } = render(
      <>
        <ListRow label="Editar perfil" subtitle="Nombre y foto" icon="person-outline" onPress={onPress} />
        <ListRow label="Eliminar cuenta" icon="trash-outline" danger onPress={onPress} />
      </>,
    );
    expect(getByText('Nombre y foto')).toBeTruthy();
    fireEvent.press(getByLabelText('Editar perfil. Nombre y foto'));
    fireEvent.press(getByText('Eliminar cuenta'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});

describe('design system components: no raw design literals', () => {
  const dir = path.resolve(__dirname, '../src/core/design-system/components');
  const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|fontFamily\s*:\s*['"`]/;
  // Named color strings assigned to color-ish props (transparent is allowed)
  const named = /[cC]olor\s*[:=]\s*\{?\s*['"](?!transparent['"])[a-z]+['"]|tint\s*[:=]\s*\{?\s*['"][a-z]+['"]/;

  const files = fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f));

  it('finds the component files', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)('%s has no hex/rgba/fontFamily/named-color literals', (file) => {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    expect({ file, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file, raw: null });
    expect({ file, named: named.exec(src)?.[0] ?? null }).toEqual({ file, named: null });
  });
});

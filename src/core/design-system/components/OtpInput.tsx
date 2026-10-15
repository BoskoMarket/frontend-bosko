import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { FONT_FAMILY } from '../typography';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface OtpInputProps {
  /** Current code (digits only, up to `length`). */
  value: string;
  onChange: (code: string) => void;
  length?: number;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}

/**
 * One-box-per-digit code input (email / phone / reset verification). Controlled:
 * `value` is the joined code. Typing advances focus, Backspace on an empty box
 * goes back, pasting a full code fills every box.
 */
export function OtpInput({ value, onChange, length = 6, label, error, autoFocus = false }: OtpInputProps) {
  const tc = useThemeColors();
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      // paste / autofill: spread across boxes starting at this one
      const next = (value.slice(0, index) + clean).slice(0, length);
      onChange(next);
      refs.current[Math.min(next.length, length - 1)]?.focus();
      return;
    }
    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(''));
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label" color={tc.textSub}>{label}</Text> : null}
      <View style={styles.row}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => { refs.current[i] = r; }}
            value={d}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={i === 0 ? length : 1}
            selectTextOnFocus
            textAlign="center"
            autoFocus={autoFocus && i === 0}
            selectionColor={TOKENS.color.signal}
            accessibilityLabel={`Dígito ${i + 1} de ${length}`}
            style={[
              styles.box,
              {
                color: tc.text,
                backgroundColor: d ? tc.accent : tc.surface2,
                borderColor: error ? TOKENS.color.error : d ? TOKENS.color.signal : tc.border,
              },
            ]}
          />
        ))}
      </View>
      {error ? <Text variant="caption" color={TOKENS.color.error} center>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: SPACING.lg },
  row: { flexDirection: 'row', gap: 9 },
  box: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontFamily: FONT_FAMILY.display,
  },
});

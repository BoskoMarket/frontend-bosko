import React, { forwardRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, TextInputProps, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { withAlpha } from '../color';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  /** Ionicons a la izquierda, dentro del campo (ej. `mail-outline`, `lock-closed-outline`) */
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
}

/**
 * Input — "Señal Nocturna". Foco = anillo rosa translúcido (glow), no solo un
 * cambio de borderColor: se anima un `shadowOpacity`/`shadowRadius` con
 * Animated.timing al enfocar/desenfocar, imitando el `box-shadow` de foco del
 * sistema web.
 *
 * El glow vive en un wrapper EXTERIOR opaco (`tc.bg`) — shadow* directo sobre un
 * view con `backgroundColor` translúcido rompe en Android (sombra cuadrada / se recorta).
 * Colores 100% theme-aware (`tc.*`) + tokens de marca.
 */
export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, leftIcon, rightIcon, onRightIconPress, secureTextEntry, style, multiline, ...rest }, ref) => {
    const tc = useThemeColors();
    const [hidden, setHidden] = useState(secureTextEntry ?? false);
    const glow = React.useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
      Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };
    const handleBlur = () => {
      Animated.timing(glow, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const shadowStyle = {
      shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
      shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }),
      elevation: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
    };
    const borderStyle = !error
      ? { borderColor: glow.interpolate({ inputRange: [0, 1], outputRange: [tc.border, TOKENS.color.signal] }) }
      : null;
    const iconColor = tc.textSub;

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text variant="label">{label}</Text> : null}
        <Animated.View style={[styles.shadow, { backgroundColor: tc.bg, shadowColor: TOKENS.color.signal }, shadowStyle]}>
          <Animated.View
            style={[
              styles.wrap,
              multiline && styles.wrapMultiline,
              { backgroundColor: tc.surface2, borderColor: tc.border },
              borderStyle,
              !!error && { borderColor: TOKENS.color.error },
            ]}
          >
            {leftIcon ? <Ionicons name={leftIcon} size={19} color={iconColor} style={styles.leftIcon} /> : null}
            <TextInput
              ref={ref}
              style={[styles.input, multiline && styles.inputMultiline, { color: tc.text }, style]}
              multiline={multiline}
              placeholderTextColor={withAlpha(tc.text, 0.4)}
              selectionColor={TOKENS.color.signal}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={hidden}
              accessibilityLabel={label}
              {...rest}
            />
            {secureTextEntry ? (
              <Pressable
                onPress={() => setHidden((h) => !h)}
                hitSlop={8}
                style={styles.rightBtn}
                accessibilityRole="button"
                accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              >
                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
              </Pressable>
            ) : rightIcon ? (
              <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.rightBtn} accessibilityRole="button">
                <Ionicons name={rightIcon} size={20} color={iconColor} />
              </Pressable>
            ) : null}
          </Animated.View>
        </Animated.View>
        {error ? (
          <Text variant="caption" color={TOKENS.color.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: SPACING.xs + 2 },
  shadow: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    minHeight: 54,
    gap: SPACING.sm,
  },
  wrapMultiline: { alignItems: 'flex-start' },
  leftIcon: { marginRight: 2 },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top' },
  input: { flex: 1, fontSize: 15, paddingVertical: SPACING.md },
  rightBtn: { paddingLeft: SPACING.sm },
});

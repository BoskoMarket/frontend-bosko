import React from 'react';
import {
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    View,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: keyof typeof Ionicons.glyphMap;
    iconRight?: keyof typeof Ionicons.glyphMap;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    gradientColors?: readonly [string, string, ...string[]];
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    iconRight,
    loading = false,
    disabled = false,
    style,
    textStyle,
    gradientColors,
}) => {
    // Determine sizing
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { height: 36, paddingHorizontal: 16, fontSize: 14, iconSize: 16 };
            case 'large':
                return { height: 56, paddingHorizontal: 32, fontSize: 18, iconSize: 24 };
            default: // medium
                return { height: 48, paddingHorizontal: 24, fontSize: 16, iconSize: 20 };
        }
    };

    const { height, paddingHorizontal, fontSize, iconSize } = getSizeStyles();

    // Determine base styles for variants
    const getVariantStyles = () => {
        if (disabled) return styles.disabledProperties;

        switch (variant) {
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: Colors.premium.gold,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                };
            case 'secondary':
                return {
                    backgroundColor: Colors.premium.card,
                    borderWidth: 1,
                    borderColor: Colors.premium.borderSubtle,
                    ...styles.shadowMedium,
                };
            default: // primary
                return {
                    ...styles.shadowGold, // Spectacular shadow for primary
                };
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.premium.textTertiary;
        switch (variant) {
            case 'outline':
            case 'ghost':
                return Colors.premium.gold;
            case 'secondary':
                return Colors.premium.textPrimary;
            default:
                return Colors.premium.textPrimary; // Text on gradient
        }
    };

    // Primary gradient colors
    const defaultGradient = [Colors.colorPrimary, '#5c0117']; // Deep red/burgundy gradient from palette
    // Alternative Gold Gradient if needed: [Colors.premium.gold, '#B8860B'] 

    // We render content inside a function to reuse it
    const renderContent = () => (
        <View style={styles.contentContainer}>
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={iconSize}
                            color={getTextColor()}
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text style={[
                        styles.text,
                        { fontSize, color: getTextColor() },
                        textStyle
                    ]}>
                        {title}
                    </Text>
                    {iconRight && (
                        <Ionicons
                            name={iconRight}
                            size={iconSize}
                            color={getTextColor()}
                            style={{ marginLeft: 8 }}
                        />
                    )}
                </>
            )}
        </View>
    );

    const buttonStyles = [
        styles.base,
        { height, paddingHorizontal, borderRadius: height / 2 }, // Pill shape
        getVariantStyles(),
        style,
    ];

    if (variant === 'primary' && !disabled) {
        return (
            <Pressable
                onPress={onPress}
                disabled={loading}
                style={({ pressed }) => [
                    ...buttonStyles,
                    { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
            >
                <LinearGradient
                    colors={gradientColors || defaultGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
                />
                {renderContent()}
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                ...buttonStyles,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
        >
            {renderContent()}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible', // Important for shadows
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    disabledProperties: {
        backgroundColor: Colors.premium.inputBackground,
        borderColor: 'transparent',
    },
    // Shadows
    shadowGold: {
        shadowColor: Colors.colorPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    shadowMedium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    }
});

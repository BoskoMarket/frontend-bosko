import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { PREMIUM_SHADOWS, TOKENS, usePremiumColors } from '@/core/design-system';
import type { PremiumColors } from '@/core/design-system';
import { PremiumButton } from '@/components/PremiumButton';

const { width } = Dimensions.get('window');
const CURVE_HEIGHT = 60;

export const ProviderCTA = () => {
    const pc = usePremiumColors();
    const styles = useMemo(() => createStyles(pc), [pc]);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.wrapper}>
            <View style={styles.svgContainer}>
                <Svg
                    height={CURVE_HEIGHT}
                    width={width}
                    viewBox={`0 0 ${width} ${CURVE_HEIGHT}`}
                    style={styles.svg}
                >
                    <Path
                        d={`M0,${CURVE_HEIGHT} L0,0 C${width * 0.3},${CURVE_HEIGHT * 0.8} ${width * 0.5},${CURVE_HEIGHT} ${width},0 L${width},${CURVE_HEIGHT} Z`}
                        fill={pc.panel}
                    />
                </Svg>
            </View>

            <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
                <LinearGradient
                    colors={[pc.panel, pc.panelEnd]}
                    style={styles.contentContainer}
                >
                    <View style={styles.headerRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="crown" size={32} color={pc.gold} />
                        </View>
                        <View style={styles.textBlock}>
                            <Text style={styles.mainText}>Únete a la Élite</Text>
                            <Text style={styles.subText}>Monetiza tu talento en Bosko</Text>
                        </View>
                    </View>

                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="cash-multiple" size={20} color={pc.gold} />
                            <Text style={styles.featureText}>Pagos Rápidos</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="calendar-check" size={20} color={pc.gold} />
                            <Text style={styles.featureText}>Tu Horario</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="shield-check" size={20} color={pc.gold} />
                            <Text style={styles.featureText}>Seguro</Text>
                        </View>
                    </View>

                    <PremiumButton
                        title="Convertirme en Proveedor"
                        iconRight="arrow-forward"
                        variant="primary"
                        onPress={() => { }}
                        gradientColors={[pc.goldFill, pc.goldFillEnd]}
                        textStyle={{ color: pc.onGold, fontSize: 16, fontWeight: 'bold' }}
                        style={styles.ctaButton}
                    />
                </LinearGradient>
            </Animated.View>
        </View>
    );
};

const createStyles = (pc: PremiumColors) => StyleSheet.create({
    wrapper: {
        marginTop: 20,
        marginBottom: 40,
    },
    svgContainer: {
        height: CURVE_HEIGHT,
        marginBottom: -1, // Fix 1px gap line
    },
    svg: {
        shadowColor: TOKENS.color.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      elevation: 4,
        zIndex: 1,
    },
    container: {
        backgroundColor: pc.panel,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: pc.goldLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: pc.goldBorder,
        ...PREMIUM_SHADOWS.gold,
    },
    textBlock: {
        flex: 1,
    },
    mainText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: pc.textPrimary,
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: pc.textSecondary,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: pc.surfaceSubtle,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: pc.borderSubtle,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    featureText: {
        fontSize: 12,
        color: pc.textPrimary,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: pc.borderSubtle,
    },
    ctaButton: {
        borderRadius: 16,
        ...PREMIUM_SHADOWS.gold,
    },

});

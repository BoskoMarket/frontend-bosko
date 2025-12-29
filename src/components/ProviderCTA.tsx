import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { PremiumButton } from '@/src/components/PremiumButton';

const { width } = Dimensions.get('window');
const CURVE_HEIGHT = 60;

export const ProviderCTA = () => {
    return (
        <View style={styles.wrapper}>
            {/* Curved SVG Top */}
            <View style={styles.svgContainer}>
                <Svg
                    height={CURVE_HEIGHT}
                    width={width}
                    viewBox={`0 0 ${width} ${CURVE_HEIGHT}`}
                    style={styles.svg}
                >
                    <Path
                        d={`M0,${CURVE_HEIGHT} L0,0 C${width * 0.3},${CURVE_HEIGHT * 0.8} ${width * 0.5},${CURVE_HEIGHT} ${width},0 L${width},${CURVE_HEIGHT} Z`}
                        fill="#1a0505" // Matches the gradient start
                    />
                </Svg>
            </View>

            <MotiView
                from={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800 }}
                style={styles.container}
            >
                <LinearGradient
                    colors={['#1a0505', '#2d0a0a']}
                    style={styles.contentContainer}
                >
                    <View style={styles.headerRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="crown" size={32} color={Colors.premium.gold} />
                        </View>
                        <View style={styles.textBlock}>
                            <Text style={styles.mainText}>Únete a la Élite</Text>
                            <Text style={styles.subText}>Monetiza tu talento en Bosko</Text>
                        </View>
                    </View>

                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="cash-multiple" size={20} color={Colors.premium.gold} />
                            <Text style={styles.featureText}>Pagos Rápidos</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.premium.gold} />
                            <Text style={styles.featureText}>Tu Horario</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="shield-check" size={20} color={Colors.premium.gold} />
                            <Text style={styles.featureText}>Seguro</Text>
                        </View>
                    </View>

                    <PremiumButton
                        title="Convertirme en Proveedor"
                        iconRight="arrow-forward"
                        variant="primary"
                        onPress={() => { }}
                        gradientColors={[Colors.premium.gold, '#B8860B']}
                        textStyle={{ color: '#1a0505', fontSize: 16, fontWeight: 'bold' }}
                        style={styles.ctaButton}
                    />
                </LinearGradient>
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 20,
        marginBottom: 40,
    },
    svgContainer: {
        height: CURVE_HEIGHT,
        marginBottom: -1, // Fix 1px gap line
    },
    svg: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 1,
    },
    container: {
        backgroundColor: '#1a0505',
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
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.goldBorder,
        ...Colors.premium.shadows.gold,
    },
    textBlock: {
        flex: 1,
    },
    mainText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: Colors.premium.textSecondary,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.premium.borderSubtle,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    featureText: {
        fontSize: 12,
        color: Colors.premium.textPrimary,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: Colors.premium.borderSubtle,
    },
    ctaButton: {
        borderRadius: 16,
        overflow: 'hidden',
        ...Colors.premium.shadows.gold,
    },

});

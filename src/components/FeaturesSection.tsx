import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PREMIUM_SHADOWS, usePremiumColors } from '@/core/design-system';
import type { PremiumColors } from '@/core/design-system';


const { width } = Dimensions.get('window');

const features = [
    {
        id: '1',
        icon: 'verified-user',
        title: 'Confianza Total',
        description: 'Todos nuestros expertos pasan por un riguroso proceso de verificación.'
    },
    {
        id: '2',
        icon: 'flash-on',
        title: 'Servicio Express',
        description: 'Encuentra ayuda en minutos, no en días. Soluciones al instante.'
    },
    {
        id: '3',
        icon: 'support-agent',
        title: 'Soporte 24/7',
        description: 'Estamos contigo en cada paso. Tu tranquilidad es nuestra prioridad.'
    }
];

function FeatureCard({ item, index }: { item: typeof features[0]; index: number }) {
    const pc = usePremiumColors();
    const styles = useMemo(() => createStyles(pc), [pc]);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 600, delay: index * 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 600, delay: index * 200, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.cardWrapper, { opacity, transform: [{ translateY }] }]}>
            <LinearGradient colors={[pc.card, pc.cardEnd]} style={styles.card}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={item.icon as any} size={28} color={pc.gold} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </LinearGradient>
        </Animated.View>
    );
}

export const FeaturesSection = () => {
    const pc = usePremiumColors();
    const styles = useMemo(() => createStyles(pc), [pc]);
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>La Experiencia Bosko</Text>
            <View style={styles.grid}>
                {features.map((item, index) => (
                    <FeatureCard key={item.id} item={item} index={index} />
                ))}
            </View>
        </View>
    );
};

const createStyles = (pc: PremiumColors) => StyleSheet.create({
    container: {
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: pc.textPrimary,
        marginBottom: 20,
        marginLeft: 4,
    },
    grid: {
        gap: 16,
    },
    cardWrapper: {
        borderRadius: 16,
        ...PREMIUM_SHADOWS.medium,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: pc.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: pc.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: pc.goldBorder,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: pc.textPrimary,
        marginBottom: 4,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: pc.textSecondary,
        flex: 1,
        lineHeight: 20,
    }
});

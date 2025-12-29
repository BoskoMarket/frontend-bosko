import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Colors from '@/constants/Colors';

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

export const FeaturesSection = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>La Experiencia Bosko</Text>

            <View style={styles.grid}>
                {features.map((item, index) => (
                    <MotiView
                        key={item.id}
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: index * 200, type: 'timing', duration: 600 }}
                        style={styles.cardWrapper}
                    >
                        <LinearGradient
                            colors={[Colors.premium.card, '#1a1a1a']}
                            style={styles.card}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialIcons name={item.icon as any} size={28} color={Colors.premium.gold} />
                            </View>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </LinearGradient>
                    </MotiView>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
        marginBottom: 20,
        marginLeft: 4,
    },
    grid: {
        gap: 16,
    },
    cardWrapper: {
        borderRadius: 16,
        ...Colors.premium.shadows.medium,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.premium.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.premium.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.goldBorder,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
        marginBottom: 4,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: Colors.premium.textSecondary,
        flex: 1,
        lineHeight: 20,
    }
});

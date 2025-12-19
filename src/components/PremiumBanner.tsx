import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PremiumBanner = () => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.premium.background, '#1a0505', '#2d0a0a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Hola, Frank</Text>
                        <Text style={styles.subGreeting}>¿Qué necesitas hoy?</Text>
                    </View>
                    <Pressable style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.premium.gold} />
                    </Pressable>
                </View>

                <View style={styles.searchContainer}>
                    <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
                        <MaterialIcons name="search" size={24} color={Colors.premium.textSecondary} />
                        <TextInput
                            placeholder="Buscar servicios o profesionales..."
                            placeholderTextColor={Colors.premium.textTertiary}
                            style={styles.input}
                        />
                        <View style={styles.searchDivider} />
                        <MaterialIcons name="tune" size={24} color={Colors.premium.gold} />
                    </BlurView>
                </View>
            </LinearGradient>

            {/* Decorative bottom curve/fade */}
            <LinearGradient
                colors={['transparent', Colors.premium.background]}
                style={styles.bottomFade}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        backgroundColor: Colors.premium.background,
        // Height removed to allow auto-sizing based on content
    },
    gradient: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...Colors.premium.shadows.medium,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        height: 250,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 16,
        color: Colors.premium.textSecondary,
        marginTop: 4,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.premium.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.borderSubtle,
    },
    searchContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.premium.goldBorder,
        ...Colors.premium.shadows.gold, // Gold glow effect
    },
    searchBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.premium.textPrimary,
    },
    searchDivider: {
        width: 1,
        height: 20,
        backgroundColor: Colors.premium.borderSubtle,
        marginHorizontal: 12,
    },
    bottomFade: {
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        height: 40,
        zIndex: -1,
    }
});

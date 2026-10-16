import React, { useMemo, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    Image,
    Dimensions,
    Animated,
} from "react-native";
import { BlurView } from "@/core/components/BlurView";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceSummary } from "@/types/services";
import { GRADIENTS, TOKENS, useIsDark, usePremiumColors, withAlpha } from "@/core/design-system";
import type { PremiumColors } from "@/core/design-system";
import { LinearGradient } from "expo-linear-gradient";
import { FONT_FAMILY } from '@/core/design-system';

interface ServiceDetailModalProps {
    visible: boolean;
    onClose: () => void;
    service: ServiceSummary | null;
}

const { width } = Dimensions.get("window");

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
    visible,
    onClose,
    service,
}) => {
    const pc = usePremiumColors();
    const isDark = useIsDark();
    const styles = useMemo(() => createStyles(pc), [pc]);
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        } else {
            slideAnim.setValue(600);
        }
    }, [visible]);

    if (!service) return null;

    const formatRate = (rate: ServiceSummary["rate"]) => {
        if (!rate) return "Consultar";
        const symbol =
            rate.currency === "ARS"
                ? "$"
                : rate.currency === "USD"
                    ? "US$"
                    : `${rate.currency} `;
        const price = `${symbol}${Number(rate.amount).toLocaleString('es-AR')}`;
        return rate.unit ? `${price} / ${rate.unit}` : price;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <Animated.View
                    style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
                >
                    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
                        <View style={styles.header}>
                            <Pressable
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={20}
                            >
                                <Ionicons name="close" size={24} color={TOKENS.onMedia.icon} />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.content}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Hero Image */}
                            <View style={styles.imageContainer}>
                                {service.thumbnail ? (
                                    <Image
                                        source={{ uri: service.thumbnail }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={[pc.primary, pc.primaryDark]}
                                        style={styles.placeholderImage}
                                    >
                                        <Ionicons
                                            name="briefcase-outline"
                                            size={60}
                                            color={withAlpha(TOKENS.color.onPrimary, 0.3)}
                                        />
                                    </LinearGradient>
                                )}
                                <LinearGradient
                                    colors={GRADIENTS.overlayFadeDown}
                                    style={styles.imageOverlay}
                                />

                                <View style={styles.heroContent}>
                                    <View style={styles.chipRow}>
                                        {service.categoryName && (
                                            <View style={styles.categoryChip}>
                                                <Text style={styles.categoryText}>{service.categoryName}</Text>
                                            </View>
                                        )}
                                        <View style={styles.ratingChip}>
                                            <Ionicons name="star" size={12} color={pc.goldFill} />
                                            <Text style={styles.ratingText}>{service.averageRating ? Number(service.averageRating).toFixed(1) : 'New'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.title}>{service.title}</Text>
                                </View>
                            </View>

                            {/* Content Body */}
                            <View style={styles.body}>
                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>Descripción</Text>
                                <Text style={styles.description}>
                                    {service.summary || "Sin descripción disponible."}
                                </Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>Detalles</Text>
                                <View style={styles.detailRow}>
                                    <Ionicons name="person-outline" size={20} color={pc.textSecondary} />
                                    <Text style={styles.detailText}>{service.name}</Text>
                                </View>
                                {service.location && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={20} color={pc.textSecondary} />
                                        <Text style={styles.detailText}>{service.location}</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Footer Action */}
                        <View style={styles.footer}>
                            <Pressable
                                style={styles.hireButton}
                                onPress={() => {
                                    onClose();
                                    router.push({
                                        pathname: '/orders/quote',
                                        params: {
                                            serviceId: service.id,
                                            serviceTitle: service.title,
                                            providerName: service.name,
                                        },
                                    });
                                }}
                            >
                                <Text style={styles.hireButtonText}>Solicitar Servicio</Text>
                                <Ionicons name="arrow-forward" size={20} color={TOKENS.color.onPrimary} />
                            </Pressable>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const createStyles = (pc: PremiumColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: TOKENS.scrim.medium,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        height: "85%",
        backgroundColor: pc.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: "hidden",
        shadowColor: TOKENS.color.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 20,
    },
    modalBlur: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: TOKENS.scrim.medium,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for footer
    },
    imageContainer: {
        height: 300,
        width: "100%",
        position: 'relative',
    },
    image: {
        width: "100%",
        height: "100%",
    },
    placeholderImage: {
        width: "100%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        gap: 8,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryChip: {
        backgroundColor: pc.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: TOKENS.color.onPrimary,
        fontSize: 12,
        fontFamily: FONT_FAMILY.headingMedium,
    },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: TOKENS.scrim.medium,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: pc.goldFill,
        fontSize: 12,
        fontFamily: FONT_FAMILY.heading,
    },
    title: {
        fontSize: 28,
        fontFamily: FONT_FAMILY.heading,
        color: TOKENS.onMedia.text,
        textShadowColor: TOKENS.scrim.medium,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    body: {
        padding: 24,
    },
    divider: {
        height: 1,
        backgroundColor: pc.borderSubtle,
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.heading,
        color: pc.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.body,
        color: pc.textSecondary,
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.body,
        color: pc.textPrimary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        backgroundColor: pc.background, // Fallback
        borderTopWidth: 1,
        borderTopColor: pc.borderSubtle,
    },
    hireButton: {
        backgroundColor: pc.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: pc.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    hireButtonText: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.heading,
        color: TOKENS.color.onPrimary,
    },
});

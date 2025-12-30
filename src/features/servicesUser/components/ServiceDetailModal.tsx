import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    Image,
    Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown } from "react-native-reanimated";
import { ServiceSummary } from "@/types/services";
import Colors from "@/core/design-system/Colors";
import { TOKENS } from "@/core/design-system/tokens";
import { LinearGradient } from "expo-linear-gradient";

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
    if (!service) return null;

    const formatRate = (rate: ServiceSummary["rate"]) => {
        if (!rate) return "Consultar";
        const symbol =
            rate.currency === "ARS"
                ? "$"
                : rate.currency === "USD"
                    ? "US$"
                    : `${rate.currency} `;
        return `${symbol}${rate.amount} ${rate.unit !== "fixed" ? "/ " + rate.unit : ""
            }`;
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
                    entering={SlideInDown.springify()}
                    style={styles.modalContainer}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
                        <View style={styles.header}>
                            <Pressable
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={20}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
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
                                        colors={[Colors.colorPrimary, Colors.colorPrimaryDark]}
                                        style={styles.placeholderImage}
                                    >
                                        <Ionicons
                                            name="briefcase-outline"
                                            size={60}
                                            color="rgba(255,255,255,0.3)"
                                        />
                                    </LinearGradient>
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.8)"]}
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
                                            <Ionicons name="star" size={12} color="#FFD700" />
                                            <Text style={styles.ratingText}>{service.averageRating?.toFixed(1) || "New"}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.title}>{service.title}</Text>
                                </View>
                            </View>

                            {/* Content Body */}
                            <View style={styles.body}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Precio estimado</Text>
                                    <Text style={styles.priceValue}>{formatRate(service.rate)}</Text>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>Descripción</Text>
                                <Text style={styles.description}>
                                    {service.summary || "Sin descripción disponible."}
                                </Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>Detalles</Text>
                                <View style={styles.detailRow}>
                                    <Ionicons name="person-outline" size={20} color={Variables.iconColor} />
                                    <Text style={styles.detailText}>{service.name}</Text>
                                </View>
                                {service.location && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={20} color={Variables.iconColor} />
                                        <Text style={styles.detailText}>{service.location}</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Footer Action */}
                        <View style={styles.footer}>
                            <Pressable style={styles.hireButton} onPress={() => console.log("Hire service", service.id)}>
                                <Text style={styles.hireButtonText}>Solicitar Servicio</Text>
                                <Ionicons name="arrow-forward" size={20} color={Colors.premium.textPrimary} />
                            </Pressable>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const Variables = {
    iconColor: "rgba(255,255,255,0.7)",
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        height: "85%",
        backgroundColor: Colors.premium.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: "hidden",
        shadowColor: "#000",
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
        backgroundColor: "rgba(0,0,0,0.5)",
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
        backgroundColor: Colors.colorPrimary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    body: {
        padding: 24,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    priceLabel: {
        fontSize: 16,
        color: Colors.premium.textSecondary,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.colorPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: Colors.premium.textSecondary,
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
        color: Colors.premium.textPrimary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        backgroundColor: Colors.premium.background, // Fallback
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    hireButton: {
        backgroundColor: Colors.colorPrimary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: Colors.colorPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    hireButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.premium.textPrimary,
    },
});

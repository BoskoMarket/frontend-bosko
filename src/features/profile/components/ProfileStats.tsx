import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import Colors from "@/constants/Colors";

interface StatItemProps {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: number | string;
    delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, delay }) => {
    return (
        <Animated.View entering={FadeInUp.delay(delay)} style={styles.statItem}>
            <BlurView intensity={20} tint="dark" style={styles.statBlur}>
                <View style={styles.statContent}>
                    <MaterialIcons name={icon} size={24} color={Colors.colorPrimary} />
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                </View>
            </BlurView>
        </Animated.View>
    );
};

interface ProfileStatsProps {
    servicesCount?: number;
    reviewsCount?: number;
    rating?: number;
    completedOrders?: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
    servicesCount = 0,
    reviewsCount = 0,
    rating = 0,
    completedOrders = 0,
}) => {
    return (
        <View style={styles.container}>
            <StatItem
                icon="work"
                label="Servicios"
                value={servicesCount}
                delay={100}
            />
            <StatItem
                icon="star"
                label="Rating"
                value={rating > 0 ? rating.toFixed(1) : "N/A"}
                delay={200}
            />
            <StatItem
                icon="rate-review"
                label="Reseñas"
                value={reviewsCount}
                delay={300}
            />
            <StatItem
                icon="check-circle"
                label="Completados"
                value={completedOrders}
                delay={400}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        minWidth: "45%",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    statBlur: {
        padding: 16,
    },
    statContent: {
        alignItems: "center",
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.white,
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.6)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
});

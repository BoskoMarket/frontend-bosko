import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

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
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{servicesCount}</Text>
                <Text style={styles.statLabel}>Servicios</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {rating > 0 ? rating.toFixed(1) : "-"}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.statItem}>
                <Text style={styles.statValue}>{reviewsCount}</Text>
                <Text style={styles.statLabel}>Reseñas</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedOrders}</Text>
                <Text style={styles.statLabel}>Ventas</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 24,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: "#e2e8f0",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
});

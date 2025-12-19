import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import Colors from "@/constants/Colors";

interface InfoRowProps {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
    if (!value) return null;

    return (
        <View style={styles.infoRow}>
            <MaterialIcons name={icon} size={20} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
};

interface ProfileInfoProps {
    bio?: string;
    email: string;
    location?: string;
    memberSince: string;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
    bio,
    email,
    location,
    memberSince,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
        });
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={20} tint="light" style={styles.blur}>
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Información</Text>

                    {bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.bio}>{bio}</Text>
                        </View>
                    )}

                    <View style={styles.infoList}>
                        <InfoRow icon="email" label="Email" value={email} />
                        <InfoRow icon="location-on" label="Ubicación" value={location} />
                        <InfoRow
                            icon="calendar-today"
                            label="Miembro desde"
                            value={formatDate(memberSince)}
                        />
                    </View>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    blur: {
        padding: 20,
    },
    content: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b", // Dark text
        marginBottom: 4,
    },
    bioContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "rgba(0, 0, 0, 0.05)", // Darker tint for light bg
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.colorPrimary,
    },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        color: "#475569", // Dark gray
    },
    infoList: {
        gap: 16,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#94a3b8",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: "#334155", // Dark text
    },
});

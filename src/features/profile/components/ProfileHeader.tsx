import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/Colors";

interface ProfileHeaderProps {
    firstName: string;
    lastName?: string;
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
    onEditPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    firstName,
    lastName,
    username,
    avatarUrl,
    isVerified,
    onEditPress,
}) => {
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    return (
        <Animated.View entering={FadeInDown.delay(0)} style={styles.container}>
            {/* Avatar with gradient border */}
            <View style={styles.avatarContainer}>
                <LinearGradient
                    colors={[Colors.colorPrimary, "#F59E0B", Colors.colorPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                >
                    <View style={styles.avatarInner}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {firstName.charAt(0).toUpperCase()}
                                    {lastName?.charAt(0).toUpperCase() || ""}
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Edit button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.editButton,
                        pressed && styles.editButtonPressed,
                    ]}
                    onPress={onEditPress}
                >
                    <LinearGradient
                        colors={[Colors.colorPrimary, "#EF4444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.editButtonGradient}
                    >
                        <MaterialIcons name="edit" size={18} color={Colors.white} />
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Name and username */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.name}>{fullName}</Text>
                    {isVerified && (
                        <MaterialIcons
                            name="verified"
                            size={20}
                            color="#3B82F6"
                            style={styles.verifiedBadge}
                        />
                    )}
                </View>
                <Text style={styles.username}>@{username}</Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: 24,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatarGradient: {
        width: 130,
        height: 130,
        borderRadius: 65,
        padding: 4,
    },
    avatarInner: {
        width: "100%",
        height: "100%",
        borderRadius: 61,
        backgroundColor: "#1E293B",
        overflow: "hidden",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 48,
        fontWeight: "700",
        color: Colors.colorPrimary,
    },
    editButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    editButtonPressed: {
        transform: [{ scale: 0.95 }],
    },
    editButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#0F172A",
    },
    infoContainer: {
        alignItems: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    name: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.white,
    },
    verifiedBadge: {
        marginTop: 2,
    },
    username: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: 4,
    },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";

interface MenuItemProps {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
    showChevron?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onPress,
    color = Colors.white,
    showChevron = true,
}) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <MaterialIcons name={icon} size={24} color={color} />
                <Text style={[styles.menuItemText, { color }]}>{label}</Text>
            </View>
            {showChevron && (
                <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="rgba(255, 255, 255, 0.4)"
                />
            )}
        </Pressable>
    );
};

export const SettingsMenu: React.FC = () => {
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    return (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.container}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Configuración</Text>

                    <View style={styles.menuList}>
                        <MenuItem
                            icon="work"
                            label="Mis Servicios"
                            onPress={() => router.push("/(tabs)/profile/Services")}
                        />
                        <MenuItem
                            icon="payment"
                            label="Métodos de Pago"
                            onPress={() => router.push("/(tabs)/profile/Payments")}
                        />
                        <MenuItem
                            icon="notifications"
                            label="Notificaciones"
                            onPress={() => router.push("/(tabs)/profile/Notifications")}
                        />
                        <MenuItem
                            icon="lock"
                            label="Cambiar Contraseña"
                            onPress={() => router.push("/(tabs)/profile/ChangePassword")}
                        />
                        <MenuItem
                            icon="settings"
                            label="Configuración General"
                            onPress={() => router.push("/(tabs)/settings")}
                        />

                        <View style={styles.divider} />

                        <MenuItem
                            icon="logout"
                            label="Cerrar Sesión"
                            onPress={handleLogout}
                            color="#EF4444"
                            showChevron={false}
                        />
                    </View>
                </View>
            </BlurView>
        </Animated.View>
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
        color: Colors.white,
        marginBottom: 4,
    },
    menuList: {
        gap: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    menuItemPressed: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: 8,
    },
});

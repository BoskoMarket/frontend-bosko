import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useProfile } from "@/context/ProfileContext";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";
import { ProfileInfo } from "./components/ProfileInfo";
import { ProfileServices } from "./components/ProfileServices";
import { EditProfileModal } from "./components/EditProfileModal";
import { UpdateProfilePayload } from "@/services/profile";
import Colors from "@/constants/Colors";

export const ProfileScreen: React.FC = () => {
    const { profile, isLoading, refreshProfile, updateProfile } = useProfile();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    console.log("ProfileScreen render:", { isLoading, hasProfile: !!profile });

    if (isLoading && !profile) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.colorPrimary} />
                <Text>Loading Profile...</Text>
            </View>
        );
    }

    const handleSaveProfile = async (data: UpdateProfilePayload) => {
        await updateProfile(data);
    };

    if (!profile && !isLoading) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#1e293b', fontSize: 18, marginBottom: 10 }}>
                            No se pudo cargar el perfil
                        </Text>
                        <Text style={{ color: '#475569', fontSize: 14, textAlign: 'center' }}>
                            Intenta cerrar sesión y volver a iniciar sesión
                        </Text>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statusBarBackground} />
            <StatusBar style="dark" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refreshProfile}
                        tintColor={Colors.colorPrimary}
                        colors={[Colors.colorPrimary]}
                    />
                }
            >
                <ProfileHeader
                    firstName={profile?.firstName || ""}
                    lastName={profile?.lastName || ""}
                    username={profile?.username || ""}
                    avatarUrl={profile?.avatarUrl}
                    bannerUrl={profile?.bannerUrl}
                    isVerified={profile?.isVerified || false}
                    onEditPress={() => setIsEditModalVisible(true)}
                />

                <ProfileStats
                    servicesCount={0}
                    reviewsCount={0}
                    rating={0}
                    completedOrders={0}
                />

                <ProfileInfo
                    bio={profile?.bio || ""}
                    email={profile?.email || ""}
                    location={profile?.location || ""}
                    memberSince={profile?.createdAt || ""}
                />

                <ProfileServices />

            </ScrollView>

            <EditProfileModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSave={handleSaveProfile}
                initialData={{
                    firstName: profile?.firstName || "",
                    lastName: profile?.lastName || "",
                    bio: profile?.bio || "",
                    location: profile?.location || "",
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    statusBarBackground: {
        height: 0, // Let status bar float or handle with SafeArea
        backgroundColor: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});

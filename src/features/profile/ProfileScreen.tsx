import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useProfile } from "@/context/ProfileContext";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";
import { ProfileInfo } from "./components/ProfileInfo";
import { SettingsMenu } from "./components/SettingsMenu";
import { EditProfileModal } from "./components/EditProfileModal";
import { UpdateProfilePayload } from "@/services/profile";
import Colors from "@/constants/Colors";

export const ProfileScreen: React.FC = () => {
    const { profile, isLoading, refreshProfile, updateProfile } = useProfile();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    console.log(profile);


    const handleSaveProfile = async (data: UpdateProfilePayload) => {
        await updateProfile(data);
    };

    if (!profile && !isLoading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={["#a6b2cc", "#ffffff", "#ffffff"]}
                    style={styles.gradient}
                />
                <StatusBar style="dark" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>
                            No se pudo cargar el perfil
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' }}>
                            Intenta cerrar sesión y volver a iniciar sesión
                        </Text>
                    </View>
                    <SettingsMenu />
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#e2e6ef", "#ffffff", "#ffffff"]}
                style={styles.gradient}
            />
            <StatusBar style="dark" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refreshProfile}
                        tintColor={Colors.white}
                        colors={[Colors.colorPrimary]}
                    />
                }
            >
                <ProfileHeader
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    username={profile.username}
                    avatarUrl={profile.avatarUrl}
                    isVerified={profile.isVerified}
                    onEditPress={() => setIsEditModalVisible(true)}
                />

                <ProfileStats
                    servicesCount={0}
                    reviewsCount={0}
                    rating={0}
                    completedOrders={0}
                />

                <ProfileInfo
                    bio={profile.bio}
                    email={profile.email}
                    location={profile.location}
                    memberSince={profile.createdAt}
                />

                <SettingsMenu />
            </ScrollView>

            <EditProfileModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSave={handleSaveProfile}
                initialData={{
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    bio: profile.bio,
                    location: profile.location,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 40,
    },
});

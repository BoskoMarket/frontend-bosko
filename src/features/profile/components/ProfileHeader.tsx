import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "@/core/design-system/Colors";

interface ProfileHeaderProps {
  firstName: string;
  lastName?: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  onEditPress: () => void;
}

const { width } = Dimensions.get("window");

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  username,
  avatarUrl,
  bannerUrl,
  isVerified,
  onEditPress,
}) => {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <View style={styles.container}>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[Colors.colorPrimary, "#1e293b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          />
        )}

        {/* Edit Button (Top Right of Banner - optional, but keeping layout clean) */}
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileContent}>
        {/* Avatar with overlap */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
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
        </View>

        {/* Text Info */}
        <View style={styles.infoContainer}>
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

          {/* Placeholder for profession/title if we had it */}
          {/* <Text style={styles.profession}>Google Certified Ux/Ui Designer</Text> */}
        </View>

        {/* Edit & Settings Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.editButton} onPress={onEditPress}>
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </Pressable>
          <Pressable style={styles.settingsButton}>
            <MaterialIcons name="settings" size={24} color="#94a3b8" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bannerContainer: {
    height: 180,
    width: width,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  profileContent: {
    alignItems: "center",
    marginTop: -60, // Negative margin to overlap avatar
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.colorPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  verifiedBadge: {
    marginTop: 2,
  },
  username: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    minWidth: 200,
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import { RelativePathString, router } from "expo-router";

const user = {
  name: "Leo Gómez",
  email: "leo.gomez@mail.com",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
};

export default function ProfileHeader() {
  return (
    <View style={styles.header}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <TouchableOpacity
        onPress={() =>
          router.push("/(tabs)/profile/edit/photo" as RelativePathString)
        }
        style={styles.button}
      >
        <Text style={styles.buttonText}>Editar foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "600" },
  email: { fontSize: 14, color: "#666" },
  button: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#850021",
    borderRadius: 8,
  },
  buttonText: { color: "#fff" },
});

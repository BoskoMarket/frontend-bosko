import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export default function EditPhoto() {
  const [photo, setPhoto] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      // Aquí deberías subir la foto al backend
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      <TouchableOpacity onPress={pickImage} style={styles.btn}>
        <Text style={styles.btnText}>Cambiar foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    marginBottom: 16,
  },
  btn: { padding: 12, backgroundColor: "#850021", borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
});

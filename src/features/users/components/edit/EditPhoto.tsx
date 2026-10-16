import { View, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Button } from '@/core/design-system';

export default function EditPhoto() {
  const [photo, setPhoto] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      <Avatar uri={photo} size={120} />
      <Button label="Cambiar foto" onPress={pickImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
});

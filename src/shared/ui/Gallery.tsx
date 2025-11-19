import React from "react";
import { ScrollView, Image, StyleSheet } from "react-native";
import { Photo } from "@/src/types";

export const Gallery = ({ photos }: { photos: Photo[] }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
    {photos.map((photo) => (
      <Image
        key={photo.id}
        source={{ uri: photo.uri }}
        style={styles.photo}
        accessibilityLabel={photo.description ?? "Foto de servicio"}
      />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  photo: {
    width: 220,
    height: 130,
    borderRadius: 12,
    marginRight: 12,
  },
});

import { ScrollView, StyleSheet } from "react-native";
import React from "react";

import { RelativePathString, router } from "expo-router";
import ProfileHeader from "../components/ProfileHeader";
import ProfileSection from "../components/ProfileSection";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ProfileHeader />

      <ProfileSection
        title="Mis servicios"
        options={[
          {
            label: "Gestionar servicios",
            onPress: () => router.push("/(tabs)/profile/Services"),
          },
          {
            label: "Agregar servicio",
            onPress: () => router.push("/(tabs)/profile/AddServices"),
          },
        ]}
      />

      <ProfileSection
        title="Configuración"
        options={[
          {
            label: "Editar nombre de usuario",
            onPress: () =>
              router.push(
                `/(tabs)/profile/edit/username` as RelativePathString
              ),
          },
          {
            label: "Cambiar contraseña",
            onPress: () =>
              router.push(
                `/(tabs)/profile/edit/password` as RelativePathString
              ),
          },
          {
            label: "Actualizar foto de perfil",
            onPress: () =>
              router.push(`/(tabs)/profile/edit/photo` as RelativePathString),
          },
          {
            label: "Métodos de pago",
            onPress: () =>
              router.push(
                "/(tabs)/profile/edit/payments" as RelativePathString
              ),
          },
        ]}
      />

      <ProfileSection
        title="Cuenta"
        options={[
          {
            label: "Bosko Pro",
            onPress: () => router.push("/(tabs)/profile/BoskoPro"),
          },
          {
            label: "Cerrar sesión",
            onPress: () => console.log("Cerrar sesión"),
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});

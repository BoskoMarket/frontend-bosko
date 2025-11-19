import React from "react";
import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/Colors";

export default function TermsAndConditionsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Términos y condiciones</Text>
      <Text style={styles.paragraph}>
        Hemos enviado un correo de verificación a tu bandeja de entrada. Para
        continuar usando Bosko, por favor revisa tu email y sigue el enlace de
        confirmación. Mientras tanto, te invitamos a revisar nuestros términos y
        condiciones.
      </Text>
      <Text style={styles.paragraph}>
        Al continuar, confirmas que aceptas el uso responsable de la
        plataforma, el tratamiento de tus datos según nuestras políticas y que
        tu información de contacto es verídica.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/login")}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: Colors.dark.background,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  paragraph: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  button: {
    marginTop: 32,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.dark.background,
    fontWeight: "600",
    fontSize: 16,
  },
});

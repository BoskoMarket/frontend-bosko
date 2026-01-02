import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { useAuth } from "@/features/auth/state/AuthContext";
import { router } from "expo-router";
import Colors from "@/core/design-system/Colors";
import { Image } from "expo-image";
import ButtonBosko from "@/shared/components/ButtonBosko";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "@/core/design-system/global-styles";

export default function LogInView({ toLogin }: { toLogin: () => void }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validar campos
    if (!formData.email || !formData.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      router.replace("/(tabs)");
    } catch (error) {
      setError("Error al iniciar sesión. Por favor intenta nuevamente.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.formContainer}>
          <Image
            source={require("@/assets/images/bosko-logo.png")}
            style={globalStyles.logo}
            contentFit="contain"
          />

          <View style={styles.inputWrapper}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <Ionicons name="mail-outline" size={24} color="#FFF" style={styles.icon} />
            <TextInput
              placeholder="E-mail"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={formData.email}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, email: text }));
                setError("");
              }}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <Ionicons name="lock-closed-outline" size={24} color="#FFF" style={styles.icon} />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={formData.password}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, password: text }));
                setError("");
              }}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            <ButtonBosko
              onPress={handleLogin}
              title="Iniciar Sesión"
              isLoading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={toLogin}>
              <Text style={styles.linkText}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },

  inputWrapper: {
    width: "100%",
    height: 60,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    overflow: "hidden", // Important for BlurView to respect borderRadius
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    height: "100%",
  },
  errorText: {
    color: "#ff4d4d",
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 5,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "#FFF",
    fontSize: 16,
  },
  linkText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

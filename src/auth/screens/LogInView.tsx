import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import { useAuth } from "@/src/auth/hooks/AuthContext";
import { router } from "expo-router";
import { globalStyles } from "@/src/shared/theme/global-styles";
import Colors from "@/src/shared/theme/Colors";
import { Image } from "expo-image";

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
      const response = await login(formData);

      // response.data = 1;
      // if (response.data) {
      //   // Registro exitoso, redirigir al login
      //   router.push("/(tabs)");
      // }
      router.push("/(tabs)");
    } catch (error) {
      setError("Error al registrar usuario. Por favor intenta nuevamente.");
      console.error("Register error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        // Dismiss keyboard on press outside of input
        Keyboard.dismiss();
      }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80} // ajustá si tenés header
      >
        <View
          style={{
            alignItems: "center",
            paddingVertical: "30%",
            flex: 1,
          }}
        >
          <Image
            source={require("@/assets/images/bosko-logo.png")}
            style={{
              width: 180,
              height: 180,
              marginBottom: 20,
            }}
            contentFit="contain"
          />
          <TextInput
            placeholder="E-mail"
            value={formData.email}
            placeholderTextColor={"gray"}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, email: text }));
              setError("");
            }}
            style={globalStyles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            error={!!error}
            onSubmitEditing={() => {
              // Focus next input on submit
              Keyboard.dismiss();
            }}
            left={<TextInput.Icon icon="email" color="gray" />}
          />

          <TextInput
            placeholder="Contraseña"
            value={formData.password}
            placeholderTextColor={"gray"}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, password: text }));
              setError("");
            }}
            style={globalStyles.input}
            secureTextEntry
            right={<TextInput.Icon icon="eye" />}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            error={!!error}
            onSubmitEditing={() => {
              // Dismiss keyboard on submit
              Keyboard.dismiss();
            }}
            left={<TextInput.Icon icon="lock" color="gray" />}
          />
          {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              { opacity: pressed || isLoading ? 0.7 : 1 },
            ]}
          >
            <Text>{isLoading ? "Registrando..." : "Registrarse"}</Text>
          </Pressable>
          <Text
            style={{
              marginTop: 20,
            }}
            onPress={() => toLogin()}
          >
            ¿No tienes cuenta?
            <Pressable
              style={{
                flexDirection: "row",
                alignContent: "center",
                justifyContent: "center",
              }}
              onPress={() => router.push("/login/RegisterView")}
            >
              <Text
                style={{
                  color: Colors.colorPrimary,
                }}
              >
                Regístrate aquí
              </Text>
            </Pressable>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

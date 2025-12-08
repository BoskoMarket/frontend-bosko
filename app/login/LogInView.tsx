import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { globalStyles } from "@/styles/global-styles";
import Colors from "@/constants/Colors";
import { isValidEmail } from "@/utils/validators";

interface LogInViewProps {
  toLogin: () => void;
}

export default function LogInView({ toLogin }: LogInViewProps) {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    return Boolean(credentials.email && credentials.password);
  }, [credentials]);

  const handleChange = (key: "email" | "password", value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError("");
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    const emailValidation = isValidEmail(credentials.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }

    if (!credentials.password) {
      errors.password = "La contraseña es obligatoria";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await login(credentials);
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo iniciar sesión, usuario o contraseña incorrectos";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.innerContainer}>
          <Image
            source={require("@/assets/images/bosko-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.formContainer}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>

            <TextInput
              label="Correo electrónico"
              mode="flat"
              value={credentials.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              error={Boolean(fieldErrors.email)}
              placeholder="Correo electrónico"
              testID="login-email"
              underlineColor={Colors.colorPrimary}
              activeOutlineColor={Colors.colorPrimary}
              accessibilityIgnoresInvertColors={true}
              activeUnderlineColor={Colors.colorPrimary}
            />
            {fieldErrors.email ? (
              <Text style={globalStyles.textError}>{fieldErrors.email}</Text>
            ) : null}

            <TextInput
              label="Contraseña"
              mode="flat"
              value={credentials.password}
              onChangeText={(value) => handleChange("password", value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              error={Boolean(fieldErrors.password)}
              placeholder="Contraseña"
              testID="login-password"
              underlineColor={Colors.colorPrimary}
              activeOutlineColor={Colors.colorPrimary}
              accessibilityIgnoresInvertColors={true}
              activeUnderlineColor={Colors.colorPrimary}
            />
            {fieldErrors.password ? (
              <Text style={globalStyles.textError}>{fieldErrors.password}</Text>
            ) : null}

            <Pressable
              style={[
                styles.submitButton,
                !isFormValid && styles.submitButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>Iniciar sesión</Text>
              )}
            </Pressable>

            {submitError ? (
              <Text style={[globalStyles.textError, styles.submitError]}>
                {submitError}
              </Text>
            ) : null}

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>
              <Pressable onPress={toLogin} accessibilityRole="button">
                <Text style={styles.linkText}> Regístrate aquí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 32,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: Colors.white,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: Colors.colorPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.dark.background,
    fontWeight: "600",
    fontSize: 16,
  },
  submitError: {
    textAlign: "center",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: Colors.white,
  },
  linkText: {
    color: Colors.colorPrimary,
    fontWeight: "600",
  },
});

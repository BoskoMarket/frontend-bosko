import React, { useState, useMemo } from "react";
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
    ScrollView,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { globalStyles } from "@/styles/global-styles";
import Colors from "@/constants/Colors";
import { isValidEmail } from "@/utils/validators";

interface RegisterViewProps {
    toLogin: () => void;
}

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    userName: string;
    firstName: string;
    lastName: string;
}

interface FieldErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    userName?: string;
    firstName?: string;
    lastName?: string;
}

export default function RegisterView({ toLogin }: RegisterViewProps) {
    const { registerUser, checkUsernameAvailability } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
        userName: "",
        firstName: "",
        lastName: "",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const isFormValid = useMemo(() => {
        return Boolean(
            formData.email &&
            formData.password &&
            formData.confirmPassword &&
            formData.userName &&
            formData.firstName &&
            formData.lastName &&
            formData.password === formData.confirmPassword
        );
    }, [formData]);

    const handleChange = (key: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
        setSubmitError("");
    };

    const validateUsername = async (username: string) => {
        if (!username || username.length < 3) {
            setFieldErrors((prev) => ({
                ...prev,
                userName: "El nombre de usuario debe tener al menos 3 caracteres",
            }));
            return false;
        }

        setIsCheckingUsername(true);
        try {
            const exists = await checkUsernameAvailability(username);
            if (exists) {
                setFieldErrors((prev) => ({
                    ...prev,
                    userName: "Este nombre de usuario ya está en uso",
                }));
                return false;
            }
            setFieldErrors((prev) => ({ ...prev, userName: undefined }));
            return true;
        } catch (error) {
            setFieldErrors((prev) => ({
                ...prev,
                userName: "No se pudo verificar el nombre de usuario",
            }));
            return false;
        } finally {
            setIsCheckingUsername(false);
        }
    };

    const validateForm = async () => {
        const errors: FieldErrors = {};

        // Validar email
        const emailValidation = isValidEmail(formData.email);
        if (!emailValidation.valid) {
            errors.email = emailValidation.error;
        }

        // Validar nombre de usuario
        if (!formData.userName) {
            errors.userName = "El nombre de usuario es obligatorio";
        } else if (formData.userName.length < 3) {
            errors.userName = "El nombre de usuario debe tener al menos 3 caracteres";
        }

        // Validar nombre
        if (!formData.firstName) {
            errors.firstName = "El nombre es obligatorio";
        }

        // Validar apellido
        if (!formData.lastName) {
            errors.lastName = "El apellido es obligatorio";
        }

        // Validar contraseña
        if (!formData.password) {
            errors.password = "La contraseña es obligatoria";
        } else if (formData.password.length < 6) {
            errors.password = "La contraseña debe tener al menos 6 caracteres";
        }

        // Validar confirmación de contraseña
        if (!formData.confirmPassword) {
            errors.confirmPassword = "Debes confirmar tu contraseña";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Las contraseñas no coinciden";
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return false;
        }

        // Verificar username disponible
        const usernameAvailable = await validateUsername(formData.userName);
        return usernameAvailable;
    };

    const handleRegister = async () => {
        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await registerUser({
                email: formData.email,
                password: formData.password,
                userName: formData.userName,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });
            router.replace("/(tabs)");
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                "No se pudo completar el registro. Por favor intenta nuevamente.";
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
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={require("@/assets/images/bosko-logo.png")}
                        style={styles.logo}
                        contentFit="contain"
                    />

                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Crear cuenta</Text>

                        <TextInput
                            label="Nombre"
                            mode="flat"
                            value={formData.firstName}
                            onChangeText={(value) => handleChange("firstName", value)}
                            autoCapitalize="words"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.firstName)}
                            placeholder="Nombre"
                            testID="register-firstName"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                        />
                        {fieldErrors.firstName ? (
                            <Text style={globalStyles.textError}>{fieldErrors.firstName}</Text>
                        ) : null}

                        <TextInput
                            label="Apellido"
                            mode="flat"
                            value={formData.lastName}
                            onChangeText={(value) => handleChange("lastName", value)}
                            autoCapitalize="words"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.lastName)}
                            placeholder="Apellido"
                            testID="register-lastName"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                        />
                        {fieldErrors.lastName ? (
                            <Text style={globalStyles.textError}>{fieldErrors.lastName}</Text>
                        ) : null}

                        <TextInput
                            label="Nombre de usuario"
                            mode="flat"
                            value={formData.userName}
                            onChangeText={(value) => handleChange("userName", value)}
                            onBlur={() => {
                                if (formData.userName) {
                                    validateUsername(formData.userName);
                                }
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.userName)}
                            placeholder="Nombre de usuario"
                            testID="register-userName"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                            right={
                                isCheckingUsername ? (
                                    <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                                ) : null
                            }
                        />
                        {fieldErrors.userName ? (
                            <Text style={globalStyles.textError}>{fieldErrors.userName}</Text>
                        ) : null}

                        <TextInput
                            label="Correo electrónico"
                            mode="flat"
                            value={formData.email}
                            onChangeText={(value) => handleChange("email", value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.email)}
                            placeholder="Correo electrónico"
                            testID="register-email"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                        />
                        {fieldErrors.email ? (
                            <Text style={globalStyles.textError}>{fieldErrors.email}</Text>
                        ) : null}

                        <TextInput
                            label="Contraseña"
                            mode="flat"
                            value={formData.password}
                            onChangeText={(value) => handleChange("password", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.password)}
                            placeholder="Contraseña (mínimo 6 caracteres)"
                            testID="register-password"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                        />
                        {fieldErrors.password ? (
                            <Text style={globalStyles.textError}>{fieldErrors.password}</Text>
                        ) : null}

                        <TextInput
                            label="Confirmar contraseña"
                            mode="flat"
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleChange("confirmPassword", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                            error={Boolean(fieldErrors.confirmPassword)}
                            placeholder="Confirmar contraseña"
                            testID="register-confirmPassword"
                            underlineColor={Colors.colorPrimary}
                            activeOutlineColor={Colors.colorPrimary}
                            activeUnderlineColor={Colors.colorPrimary}
                        />
                        {fieldErrors.confirmPassword ? (
                            <Text style={globalStyles.textError}>
                                {fieldErrors.confirmPassword}
                            </Text>
                        ) : null}

                        <Pressable
                            style={[
                                styles.submitButton,
                                !isFormValid && styles.submitButtonDisabled,
                            ]}
                            onPress={handleRegister}
                            disabled={isSubmitting || !isFormValid || isCheckingUsername}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.submitText}>Registrarse</Text>
                            )}
                        </Pressable>

                        {submitError ? (
                            <Text style={[globalStyles.textError, styles.submitError]}>
                                {submitError}
                            </Text>
                        ) : null}

                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
                            <Pressable onPress={toLogin} accessibilityRole="button">
                                <Text style={styles.linkText}> Inicia sesión aquí</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    logo: {
        width: 120,
        height: 120,
        alignSelf: "center",
        marginBottom: 24,
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

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native-paper";
import { AnimatePresence, MotiView } from "moti";
import { Image } from "expo-image";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { globalStyles } from "@/styles/global-styles";
import {
  isValidEmail,
  isValidFullName,
  isValidPhone,
  isValidUsername,
  validatePassword,
} from "@/utils/validators";

interface RegisterViewProps {
  toLogin: () => void;
}

type RegisterForm = {
  email: string;
  fullName: string;
  username: string;
  nationality: string;
  countryOfResidence: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FieldKey = keyof RegisterForm;
type AsyncField = "email" | "username" | "phone";

type StepConfig = {
  id: string;
  title: string;
  description?: string;
  fields: FieldKey[];
};

const steps: StepConfig[] = [
  {
    id: "profile",
    title: "Tu información de contacto",
    description: "Cuéntanos quién eres",
    fields: ["email", "fullName"],
  },
  {
    id: "identity",
    title: "Detalles de tu cuenta",
    description: "Elige cómo quieres que te encontremos",
    fields: ["username", "nationality"],
  },
  {
    id: "location",
    title: "Ubicación y contacto",
    description: "Queremos saber dónde estás",
    fields: ["countryOfResidence", "phone"],
  },
  {
    id: "security",
    title: "Crea tu contraseña",
    description: "Protege tu cuenta con una contraseña segura",
    fields: ["password", "confirmPassword"],
  },
];

const asyncFields: AsyncField[] = ["email", "username", "phone"];

const fieldConfig: Record<FieldKey, { label: string; placeholder: string; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none" | "words" }> = {
  email: {
    label: "Correo electrónico",
    placeholder: "nombre@ejemplo.com",
    keyboardType: "email-address",
    autoCapitalize: "none",
  },
  fullName: {
    label: "Nombre completo",
    placeholder: "Nombre y apellido",
    autoCapitalize: "words",
  },
  username: {
    label: "Nombre de usuario",
    placeholder: "tu_usuario",
    autoCapitalize: "none",
  },
  nationality: {
    label: "Nacionalidad",
    placeholder: "Ej. Argentina",
    autoCapitalize: "words",
  },
  countryOfResidence: {
    label: "País de residencia",
    placeholder: "Dónde vives actualmente",
    autoCapitalize: "words",
  },
  phone: {
    label: "Teléfono",
    placeholder: "+54 11 1234 5678",
    keyboardType: "phone-pad",
  },
  password: {
    label: "Contraseña",
    placeholder: "Mínimo 8 caracteres",
  },
  confirmPassword: {
    label: "Confirmar contraseña",
    placeholder: "Repite tu contraseña",
  },
};

export default function RegisterView({ toLogin }: RegisterViewProps) {
  const {
    registerUser,
    checkEmailAvailability,
    checkUsernameAvailability,
    isPhoneUnique,
  } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    fullName: "",
    username: "",
    nationality: "",
    countryOfResidence: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [availability, setAvailability] = useState<
    Record<AsyncField, { loading: boolean; checkedValue: string; available: boolean }>
  >({
    email: { loading: false, checkedValue: "", available: true },
    username: { loading: false, checkedValue: "", available: true },
    phone: { loading: false, checkedValue: "", available: true },
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);

  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;

  const passwordStrengthColor = useMemo(() => {
    if (passwordStrength >= 0.8) return "#4CAF50";
    if (passwordStrength >= 0.5) return "#FFC107";
    if (passwordStrength > 0) return "#EF5350";
    return "rgba(255,255,255,0.2)";
  }, [passwordStrength]);

  const handleChange = (field: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");

    if ((asyncFields as string[]).includes(field)) {
      setAvailability((prev) => ({
        ...prev,
        [field as AsyncField]: {
          loading: false,
          checkedValue: "",
          available: true,
        },
      }));
    }

    if (field === "password") {
      const result = validatePassword(value);
      setPasswordStrength(result.strength);
      setPasswordRequirements(result.unmetRequirements);

      if (form.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            form.confirmPassword === value
              ? undefined
              : "Las contraseñas no coinciden",
        }));
      }
    }

    if (field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value && value === form.password
            ? undefined
            : value
            ? "Las contraseñas no coinciden"
            : "Debes confirmar tu contraseña",
      }));
    }
  };

  const validateField = (field: FieldKey): string | undefined => {
    switch (field) {
      case "email": {
        const result = isValidEmail(form.email);
        return result.valid ? undefined : result.error;
      }
      case "fullName": {
        const result = isValidFullName(form.fullName);
        return result.valid ? undefined : result.error;
      }
      case "username": {
        const result = isValidUsername(form.username);
        return result.valid ? undefined : result.error;
      }
      case "nationality": {
        if (!form.nationality.trim()) {
          return "Selecciona tu nacionalidad";
        }
        return undefined;
      }
      case "countryOfResidence": {
        if (!form.countryOfResidence.trim()) {
          return "Selecciona tu país de residencia";
        }
        return undefined;
      }
      case "phone": {
        const result = isValidPhone(form.phone);
        return result.valid ? undefined : result.error;
      }
      case "password": {
        const validation = validatePassword(form.password);
        setPasswordStrength(validation.strength);
        setPasswordRequirements(validation.unmetRequirements);
        return validation.valid
          ? undefined
          : validation.error || "La contraseña no cumple con los requisitos";
      }
      case "confirmPassword": {
        if (!form.confirmPassword) {
          return "Debes confirmar tu contraseña";
        }
        if (form.confirmPassword !== form.password) {
          return "Las contraseñas no coinciden";
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateStep = () => {
    const step = steps[currentStep];
    let valid = true;
    const newErrors: Partial<Record<FieldKey, string>> = {};

    step.fields.forEach((field) => {
      const message = validateField(field);
      if (message) {
        newErrors[field] = message;
        valid = false;
      }
    });

    if (!valid) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }

    return valid;
  };

  const ensureAvailability = async (field: AsyncField) => {
    const value = form[field];

    if (!value.trim()) {
      return false;
    }

    const validators = {
      email: isValidEmail,
      username: isValidUsername,
      phone: isValidPhone,
    } as const;

    const validation = validators[field](value);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, [field]: validation.error }));
      return false;
    }

    const cached = availability[field];
    if (cached.checkedValue === value && cached.available) {
      return true;
    }

    setAvailability((prev) => ({
      ...prev,
      [field]: { ...prev[field], loading: true },
    }));

    try {
      let available = true;
      if (field === "email") {
        available = await checkEmailAvailability(value);
      } else if (field === "username") {
        available = await checkUsernameAvailability(value);
      } else {
        available = await isPhoneUnique(value);
      }

      setAvailability((prev) => ({
        ...prev,
        [field]: {
          loading: false,
          checkedValue: value,
          available,
        },
      }));

      if (!available) {
        const messages: Record<AsyncField, string> = {
          email: "Este correo electrónico ya está registrado",
          username: "Este nombre de usuario ya está en uso",
          phone: "Este teléfono ya está registrado",
        };
        setErrors((prev) => ({ ...prev, [field]: messages[field] }));
        return false;
      }

      return true;
    } catch (error: any) {
      const fallbackMessage =
        error?.message || "No pudimos validar este dato, intenta nuevamente";
      setAvailability((prev) => ({
        ...prev,
        [field]: {
          loading: false,
          checkedValue: value,
          available: false,
        },
      }));
      setErrors((prev) => ({ ...prev, [field]: fallbackMessage }));
      return false;
    }
  };

  const ensureAvailabilityForStep = async () => {
    const step = steps[currentStep];
    for (const field of step.fields) {
      if ((asyncFields as string[]).includes(field)) {
        const isValid = await ensureAvailability(field as AsyncField);
        if (!isValid) {
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    if (!(await ensureAvailabilityForStep())) {
      return;
    }

    setSubmitError("");
    setDirection("next");
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (!canGoBack) return;
    setSubmitError("");
    setDirection("prev");
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    if (!(await ensureAvailabilityForStep())) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await registerUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        nationality: form.nationality.trim(),
        countryOfResidence: form.countryOfResidence.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      router.push("/login/termsAndConditions");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No pudimos completar el registro";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldKey) => {
    const config = fieldConfig[field];
    const value = form[field];
    const showSpinner = (asyncFields as string[]).includes(field)
      ? availability[field as AsyncField].loading
      : false;

    return (
      <View key={field} style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{config.label}</Text>
          {showSpinner ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : null}
        </View>
        <TextInput
          mode="flat"
          value={value}
          onChangeText={(text) => handleChange(field, text)}
          placeholder={config.placeholder}
          style={styles.input}
          keyboardType={config.keyboardType}
          autoCapitalize={config.autoCapitalize}
          secureTextEntry={field === "password" || field === "confirmPassword"}
          autoCorrect={false}
          onBlur={() => {
            if ((asyncFields as string[]).includes(field)) {
              void ensureAvailability(field as AsyncField);
            }
          }}
          error={Boolean(errors[field])}
        />
        {errors[field] ? (
          <Text style={globalStyles.textError}>{errors[field]}</Text>
        ) : null}
      </View>
    );
  };

  const renderPasswordHelpers = () => (
    <View style={styles.passwordHelperContainer}>
      <View style={styles.strengthBarBackground}>
        <View
          style={[
            styles.strengthBarFill,
            {
              width: `${Math.max(passwordStrength, 0.1) * 100}%`,
              backgroundColor: passwordStrengthColor,
            },
          ]}
        />
      </View>
      {passwordRequirements.length > 0 ? (
        <View style={styles.requirementsList}>
          {passwordRequirements.map((requirement) => (
            <Text key={requirement} style={globalStyles.textError}>
              • {requirement}
            </Text>
          ))}
        </View>
      ) : form.password ? (
        <Text style={styles.successMessage}>¡Tu contraseña es segura!</Text>
      ) : (
        <Text style={styles.helperText}>
          Utiliza mayúsculas, minúsculas, números y un símbolo especial.
        </Text>
      )}
    </View>
  );

  const renderStep = () => {
    const step = steps[currentStep];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.description ? (
          <Text style={styles.stepDescription}>{step.description}</Text>
        ) : null}
        {step.fields.map((field) => renderField(field))}
        {step.id === "security" ? renderPasswordHelpers() : null}
      </View>
    );
  };

  const progressItems = steps.map((step, index) => (
    <View
      key={step.id}
      style={[
        styles.progressDot,
        index === currentStep && styles.progressDotActive,
        index < currentStep && styles.progressDotCompleted,
      ]}
    />
  ));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image
            source={require("@/assets/images/bosko-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Paso {currentStep + 1} de {steps.length}
            </Text>
            <View style={styles.progressDots}>{progressItems}</View>
          </View>

          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={steps[currentStep].id}
              from={{ opacity: 0, translateX: direction === "next" ? 60 : -60 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: direction === "next" ? -60 : 60 }}
              transition={{ type: "timing", duration: 350 }}
            >
              {renderStep()}
            </MotiView>
          </AnimatePresence>

          {submitError ? (
            <Text style={[globalStyles.textError, styles.submitError]}>
              {submitError}
            </Text>
          ) : null}

          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.secondaryButton, !canGoBack && styles.secondaryButtonDisabled]}
              onPress={handlePrevious}
              disabled={!canGoBack}
            >
              <Text style={styles.secondaryButtonText}>Atrás</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={isLastStep ? handleSubmit : handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLastStep ? "Crear cuenta" : "Siguiente"}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <Pressable onPress={toLogin} accessibilityRole="button">
              <Text style={styles.linkText}> Inicia sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 64,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  progressText: {
    color: Colors.white,
    marginBottom: 12,
    fontWeight: "500",
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotActive: {
    backgroundColor: Colors.gold,
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: Colors.colorPrimary,
  },
  stepContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
  },
  stepDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  fieldContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: Colors.white,
    fontWeight: "500",
    fontSize: 14,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: Colors.white,
  },
  passwordHelperContainer: {
    marginTop: 4,
    gap: 8,
  },
  strengthBarBackground: {
    height: 6,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  requirementsList: {
    gap: 4,
  },
  helperText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  successMessage: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: Colors.gold,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.dark.background,
    fontWeight: "600",
  },
  submitError: {
    marginTop: 12,
    textAlign: "center",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: Colors.white,
  },
  linkText: {
    color: Colors.colorPrimary,
    fontWeight: "600",
  },
});

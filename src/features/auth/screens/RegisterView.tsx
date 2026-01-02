import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { router } from "expo-router";
import ButtonBosko from "@/shared/components/ButtonBosko";
import { Image } from "expo-image";
import { useAuth } from "@/features/auth/state/AuthContext";
import { globalStyles } from "@/core/design-system/global-styles";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

// Map fields to icons
const FIELD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  email: "mail-outline",
  password: "lock-closed-outline",
  firstName: "person-outline",
  lastName: "person-outline",
  userName: "person-circle-outline",
  phone: "call-outline",
  location: "location-outline",
};

export default function RegisterView({ toLogin }: { toLogin: () => void }) {
  const { registerUser } = useAuth();
  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const width = Dimensions.get("window").width;

  type FormField =
    | "password"
    | "email"
    | "firstName"
    | "lastName"
    | "userName"
    | "phone"
    | "location";

  type RegisterFormData = {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    userName: string;
    phone: string;
    location: string;
  };

  const [formData, setFormData] = React.useState<RegisterFormData>({
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    userName: "",
    phone: "",
    location: "",
  });

  const steps: { label: string; field: FormField }[] = [
    { label: "Correo electrónico", field: "email" },
    { label: "Contraseña", field: "password" },
    { label: "Nombre", field: "firstName" },
    { label: "Apellido", field: "lastName" },
    { label: "Nombre de usuario", field: "userName" },
    { label: "Teléfono", field: "phone" },
    { label: "Ubicación", field: "location" },
  ];

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  const handleFinish = async () => {
    try {
      await registerUser(formData);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Image
          source={require("@/assets/images/bosko-logo.png")}
          style={globalStyles.logo}
          contentFit="contain"
        />

        <View style={styles.carouselContainer}>
          <Carousel
            loop={false}
            width={width * 0.9} // 90% width
            height={200}
            autoPlay={false}
            ref={ref}
            data={steps}
            renderItem={({ item }) => (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>{item.label}</Text>

                <View style={styles.inputWrapper}>
                  <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                  <Ionicons
                    name={FIELD_ICONS[item.field] || "create-outline"}
                    size={24}
                    color="#FFF"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={item.label}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData[item.field]}
                    onChangeText={(text) =>
                      setFormData({ ...formData, [item.field]: text })
                    }
                    keyboardType={
                      item.field === "email"
                        ? "email-address"
                        : item.field === "phone"
                          ? "phone-pad"
                          : "default"
                    }
                    secureTextEntry={item.field === "password"}
                    autoCapitalize={item.field === "email" ? "none" : "sentences"}
                  />
                </View>
              </View>
            )}
            onProgressChange={(offsetProgress, absoluteProgress) => {
              progress.value = absoluteProgress;
              setCurrentIndex(Math.round(absoluteProgress));
            }}
          />
        </View>

        <Pagination.Basic
          progress={progress}
          data={steps}
          size={10}
          dotStyle={{
            width: 10,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
          activeDotStyle={{
            borderRadius: 5,
            overflow: "hidden",
            backgroundColor: globalStyles.colorPrimary,
          }}
          containerStyle={{
            gap: 8,
            marginBottom: 30,
          }}
          horizontal
          onPress={onPressPagination}
        />

        <View style={styles.buttonContainer}>
          {currentIndex === steps.length - 1 ? (
            <ButtonBosko title="Finalizar Registro" onPress={handleFinish} />
          ) : (
            <ButtonBosko
              title="Siguiente"
              onPress={() => ref.current?.scrollTo({ count: 1, animated: true })}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={toLogin}>
            <Text style={styles.linkText}>Inicia Sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  carouselContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inputWrapper: {
    width: "100%",
    height: 60,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    overflow: "hidden",
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
  buttonContainer: {
    width: '80%',
    marginBottom: 30,
    alignItems: 'center',
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

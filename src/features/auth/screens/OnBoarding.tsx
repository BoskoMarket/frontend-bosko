/**
 * OnBoarding - Pantalla de bienvenida con carrusel de slides
 * Se muestra solo la primera vez que el usuario abre la app
 * Guarda el estado de completado en AsyncStorage y redirige según el estado de autenticación
 */

import { View, StyleSheet, Dimensions, Text } from "react-native";
import React from "react";
import { Redirect, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Carousel, {
  ICarouselInstance,
} from "react-native-reanimated-carousel";
import OnBoardingSlide from "@/features/auth/components/OnBoardingSlide";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { globalStyles } from "@/core/design-system/global-styles";
import ButtonBosko from "@/shared/components/ButtonBosko";
import { useAuth } from "@/features/auth/state/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/core/design-system/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnBoarding() {
  const progress = useSharedValue<number>(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { authLoaded, authState } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);

  const ref = React.useRef<ICarouselInstance>(null);

  const slides = [
    {
      title: "¡Hola!",
      subtitle:
        "Bienvenido a Bosko, donde podrás encontrar u ofrecer empleo fácilmente",
      image: require("@/assets/lotties/ltUPpJrUU2.json"),
    },
    {
      title: "Servicios en segundos",
      subtitle: "Desde plomería hasta clases particulares, todo en un lugar",
      image: require("@/assets/lotties/pantalla-empleo.json"),
    },
    {
      title: "Todo en un solo lugar",
      subtitle:
        "Más de 20 categorías disponibles: Hogar, reparaciones, clases y más...",
      image: require("@/assets/lotties/chico-compu.json"),
    },
    {
      title: "Profesionales verificados",
      subtitle:
        "Lee reseñas reales y precios claros. Elige el mejor con confianza",
      image: require("@/assets/lotties/hombre-escribiendo.json"),
    },
    {
      title: "¡Regístrate ahora!",
      subtitle:
        "Crea tu cuenta y comienza a explorar las oportunidades laborales",
      image: require("@/assets/lotties/register2.json"),
    },
  ];

  // Componente de paginación personalizada con puntos deslizantes
  const PaginationDot = ({ index, animValue }: { index: number; animValue: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
      // Interpolar el ancho del punto según la posición actual
      // Si la diferencia es menor a 0.5, es el punto activo
      const isActive = Math.abs(animValue.value - index) < 0.5;

      return {
        width: withSpring(isActive ? 30 : 10),
        backgroundColor: isActive ? Colors.colorPrimary : "rgba(0, 0, 0, 0.2)",
      };
    });

    return (
      <Animated.View
        style={[
          {
            height: 10,
            borderRadius: 5,
            marginHorizontal: 5,
          },
          animatedStyle,
        ]}
      />
    );
  };

  // Verificar si el onboarding ya fue completado al montar el componente
  // React.useEffect(() => {
  //   const checkOnboarding = async () => {
  //     try {
  //       const completed = await AsyncStorage.getItem("onboardingComplete");
  //       setOnboardingComplete(completed === "true");
  //     } catch (error) {
  //       console.error("Error checking onboarding status:", error);
  //       setOnboardingComplete(false);
  //     }
  //   };
  //   checkOnboarding();
  // }, []);

  // Mostrar pantalla vacía mientras se verifica el estado del onboarding
  // if (onboardingComplete === null) {
  //   return null;
  // }

  // Si el onboarding está completo, redirigir según el estado de autenticación
  if (onboardingComplete) {
    if (authLoaded && authState.token) {
      return <Redirect href="/(tabs)" />;
    } else if (authLoaded) {
      return <Redirect href="/login" />;
    }
    return null;
  }

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingComplete", "true");
      router.push("/login");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.push("/login");
    }
  };

  return (
    <LinearGradient
      colors={["#f0f4ff", "#e8f0ff", "#fef3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header con Logo y Nombre */}
      <View style={styles.header}>
        {/* Usamos un texto estilizado y si es posible la imagen del logo */}
        <Image
          source={require("@/assets/images/bosko-logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.headerTitle}>Bosko</Text>
      </View>

      <View style={styles.carouselContainer}>
        <Carousel
          loop={false}
          width={SCREEN_WIDTH}
          height={600}
          autoPlay={false}
          data={slides}
          renderItem={({ item }) => <OnBoardingSlide item={item} />}
          ref={ref}
          onProgressChange={(offsetProgress, absoluteProgress) => {
            progress.value = absoluteProgress;
            const newIndex = Math.round(absoluteProgress);
            setCurrentIndex(newIndex);
          }}
        />

        {/* Paginación Personalizada */}
        <View style={styles.paginationContainer}>
          {slides.map((_, index) => (
            <PaginationDot key={index} index={index} animValue={progress} />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex === slides.length - 1 ? (
            <ButtonBosko
              onPress={handleOnboardingComplete}
              title="Iniciar Sesión"
            />
          ) : (
            <ButtonBosko
              onPress={() => {
                ref.current?.scrollTo({
                  count: 1,
                  animated: true,
                });
              }}
              title="Siguiente"
            />
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 100,
    borderColor: Colors.colorPrimary,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 28, // Más grande y visible
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 0.5,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    height: 20,
    gap: 8,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 60,
  },
});

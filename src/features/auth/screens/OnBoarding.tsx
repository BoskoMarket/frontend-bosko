import { View, StyleSheet } from "react-native";
import React from "react";
import { Redirect, router } from "expo-router";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import OnBoardingSlide from "@/features/auth/components/OnBoardingSlide";
import { useSharedValue } from "react-native-reanimated";
import { globalStyles } from "@/core/design-system/global-styles";
import ButtonBosko from "@/shared/components/ButtonBosko";
import { useAuth } from "@/features/auth/state/AuthContext";

export default function OnBoarding() {
  const progress = useSharedValue<number>(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { authLoaded, authState } = useAuth();

  const ref = React.useRef<ICarouselInstance>(null);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };
  const slides = [
    {
      title: "Hola!",
      subtitle:
        "Bienvenido a Bosko, donde podrás encontrar u ofrecer empleo fácilmente",
      image: require("@/assets/images/bosko-logo.svg"),
    },
    {
      title: "Servicios en segundos",
      subtitle: "Desde plomeria hasta clases particulares, todo en un lugar",
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
      title: "¡Registrate ahora!",
      subtitle:
        "Crea tu cuenta y comienza a explorar las oportunidades laborales",
      image: require("@/assets/lotties/register2.json"),
    },
  ];
  if (authLoaded && authState.token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", top: 50 }}>
      <Carousel
        style={{ marginTop: 30 }}
        loop={false}
        width={400}
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
      <Pagination.Basic
        progress={progress}
        data={slides}
        size={14}
        dotStyle={{
          width: 14,
          borderRadius: 14,
          backgroundColor: "gray",
        }}
        activeDotStyle={{
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: globalStyles.colorPrimary,
        }}
        containerStyle={[
          {
            gap: 5,
            marginBottom: 10,
          },
        ]}
        horizontal
        onPress={onPressPagination}
      />

      {currentIndex === slides.length - 1 ? (
        <ButtonBosko
          onPress={() => router.push("/login")}
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
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 150,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    borderColor: "gray",
    borderWidth: 2,
    maxWidth: 200,
    width: "100%",
    textAlign: "center",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  container: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  text: {
    fontFamily: "System",
    fontWeight: "200",
    fontSize: 18,
    color: "#000",
    textAlign: "center",
  },
});

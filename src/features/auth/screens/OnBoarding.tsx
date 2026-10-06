import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Pressable,
  ListRenderItemInfo,
  StatusBar,
} from "react-native";
import { router, Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, GRADIENTS, PALETTE, TOKENS, Text } from "@/core/design-system";
import { BrandMark } from "@/components/BrandMark";

const { width: W, height: H } = Dimensions.get("window");
const CARD_H = 340;
// Onboarding is intentionally always dark, regardless of the theme toggle.
const DARK = PALETTE.dark;

type Slide = { key: string; title: string; subtitle: string; lottie: any };

// Copy sin cambios respecto al OnBoarding.tsx actual — solo cambia el chrome visual.
const SLIDES: Slide[] = [
  { key: "1", title: "¡Bienvenido a Bosko!", subtitle: "El marketplace donde encontrarás u ofrecerás servicios fácilmente", lottie: require("../../../../assets/lotties/welcome.json") },
  { key: "2", title: "Servicios en segundos", subtitle: "Desde plomería hasta clases particulares, todo en un lugar", lottie: require("../../../../assets/lotties/services.json") },
  { key: "3", title: "20+ Categorías", subtitle: "Hogar, reparaciones, clases y mucho más disponibles ahora mismo", lottie: require("../../../../assets/lotties/categories.json") },
  { key: "4", title: "Profesionales verificados", subtitle: "Lee reseñas reales y precios claros. Elige con confianza", lottie: require("../../../../assets/lotties/verified.json") },
  { key: "5", title: "¡Empieza ya!", subtitle: "Crea tu cuenta y descubre las oportunidades que te esperan", lottie: require("../../../../assets/lotties/start.json") },
];

export default function OnBoarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Slide>>(null);
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleTranslate = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    AsyncStorage.getItem("onboardingComplete")
      .then((val) => setOnboardingComplete(val === "true"))
      .catch(() => setOnboardingComplete(false));
  }, []);

  const animateTextIn = () => {
    titleOpacity.setValue(0);
    titleTranslate.setValue(16);
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(titleTranslate, { toValue: 0, damping: 22, stiffness: 160, useNativeDriver: true }),
    ]).start();
  };

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentIndex(index);
    animateTextIn();
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await complete();
    }
  };

  const complete = async () => {
    try {
      await AsyncStorage.setItem("onboardingComplete", "true");
    } catch {}
    router.replace("/login");
  };

  if (onboardingComplete === null) return null;
  if (onboardingComplete) return <Redirect href="/login" />;

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: DARK.bg }]}>
      <StatusBar barStyle="light-content" />
      {/* Fondo: negro profundo con glow rosa señal (antes: bordo oscuro) */}
      <LinearGradient colors={GRADIENTS.backdrop(DARK)} style={StyleSheet.absoluteFill} />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={handleMomentumEnd}
        style={StyleSheet.absoluteFill}
        renderItem={({ item }: ListRenderItemInfo<Slide>) => (
          <View style={styles.slideContainer}>
            <LinearGradient
              colors={GRADIENTS.glow}
              locations={[0, 0.55, 1]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={[styles.glowBlob, styles.glowBlobWide]}
            />
            <LinearGradient
              colors={GRADIENTS.glowFaint}
              locations={[0, 0.6, 1]}
              start={{ x: 0.8, y: 0 }}
              end={{ x: 0.2, y: 1 }}
              style={[styles.glowBlobInner, styles.glowBlobNarrow]}
            />
            <View style={styles.lottieWrapper}>
              <LottieView source={item.lottie} autoPlay loop style={styles.lottie} />
            </View>
          </View>
        )}
      />

      <View style={[styles.header, { paddingTop: insets.top + 22 }]}>
        <BrandMark variant="lockup" size={30} color={TOKENS.onMedia.text} />
        <Pressable onPress={complete} hitSlop={14}>
          <Text variant="bodySmall" weight="500" color={DARK.textSub} style={styles.skipText}>Saltar</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: DARK.card, // vidrio — antes tc.card sólido
            borderColor: DARK.border,
            height: CARD_H + Math.max(insets.bottom, 16),
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const dotW = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [7, 26, 7],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return <Animated.View key={i} style={[styles.dot, { width: dotW, opacity: dotOpacity, backgroundColor: TOKENS.color.signal }]} />;
          })}
        </View>

        <Animated.View style={{ flex: 1, justifyContent: "center", opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }}>
          <Text variant="h3" color={DARK.text} style={styles.title}>{slide.title}</Text>
          <Text variant="body" color={DARK.textSub} style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        <Button
          label={isLast ? "Comenzar" : "Siguiente"}
          onPress={handleNext}
          size="lg"
          fullWidth
          iconPosition="right"
          icon={<Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={18} color={TOKENS.color.onPrimary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slideContainer: { width: W, height: H, alignItems: "center", justifyContent: "flex-start", paddingBottom: CARD_H },
  glowBlob: { position: "absolute", top: H * 0.02, left: -W * 0.08, right: -W * 0.08, height: W * 0.92, opacity: 0.95 },
  glowBlobWide: { transform: [{ rotate: '-9deg' }] },
  glowBlobInner: { position: "absolute", top: H * 0.12, left: -W * 0.12, right: -W * 0.12, height: W * 0.62, opacity: 0.9 },
  glowBlobNarrow: { transform: [{ rotate: '12deg' }] },
  lottieWrapper: { flex: 1, alignItems: "center", justifyContent: "center", width: W },
  lottie: { width: W * 0.72, height: W * 0.72 },
  header: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, zIndex: 10 },
  skipText: { letterSpacing: 0.3 },
  card: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 24, gap: 18,
    borderWidth: 1, borderBottomWidth: 0,
    ...TOKENS.shadow.card, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 24,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.textMuted, alignSelf: "center", marginBottom: 6 },
  dotsRow: { flexDirection: "row", alignItems: "center", height: 18, gap: 5 },
  dot: { height: 7, borderRadius: 3.5 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.4, lineHeight: 32 },
  subtitle: { lineHeight: 21, marginTop: 2 },
});

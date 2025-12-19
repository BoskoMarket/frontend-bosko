// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from "expo-router";
import { View, Pressable, Text, StyleSheet } from "react-native";
// import { useUser } from "@/hooks/useUser";
import { TOKENS } from "@/theme/tokens";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "@/styles/global-styles";
import { CustomTabBar } from "@/src/components/CustomTabBar";

export default function TabsLayout() {
  const router = useRouter();

  const onFabPress = () => {
    router.push("/(tabs)/services");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: TOKENS.color.primary }}
      edges={["top", "left", "right"]}
    >
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,

        }}

      >
        <Tabs.Screen
          name="index"
          options={{ title: "Inicio" }}
        />

        <Tabs.Screen
          name="services"
          options={{ title: "Servicios" }}
        />
        <Tabs.Screen
          name="reels"
          options={{ title: "Reels" }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Perfil" }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Mensajes",
          }}
        />

      </Tabs>


      {/* <Pressable style={styles.fab} onPress={onFabPress}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: [{ translateX: -34 }],
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: TOKENS.color.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 32, fontWeight: "800" },
});

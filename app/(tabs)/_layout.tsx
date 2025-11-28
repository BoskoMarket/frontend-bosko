// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from "expo-router";
import { View, Pressable, Text, StyleSheet } from "react-native";
// import { useUser } from "@/hooks/useUser";
import { TOKENS } from "@/theme/tokens";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  const router = useRouter();
  // const { viewMode, hasServices } = useUser();

  // const onFabPress = () => {
  //   if (viewMode === "client") {
  //     router.push("/request/new");
  //   } else {
  //     router.push(hasServices ? "/pro/hub" : "/pro/services/new");
  //   }
  // };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 72, backgroundColor: "rgba(255,255,255,0.7)" },
          tabBarActiveTintColor: TOKENS.color.primary,
          tabBarInactiveTintColor: "#9A9AA0",
          tabBarLabelStyle: { fontSize: 12, marginBottom: 6 },
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          animation: "fade",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Inicio", tabBarIcon: () => <Text>🏠</Text> }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: "Buscar", tabBarIcon: () => <Text>🔎</Text> }}
        />
        <Tabs.Screen
          name="services"
          options={{ title: "Servicios", tabBarIcon: () => <Text>🔧</Text> }}
        />
        <Tabs.Screen
          name="reels"
          options={{ title: "Reels", tabBarIcon: () => <Text> 🎥</Text> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Perfil", tabBarIcon: () => <Text>👤</Text> }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
            title: "Mensajes",
            tabBarIcon: () => <Text>💬</Text>,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            title: "Settings",
            tabBarIcon: () => <Text>⚙️</Text>,
          }}
        />
      </Tabs>

      {/* FAB central
      <Pressable style={styles.fab} onPress={onFabPress}>
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

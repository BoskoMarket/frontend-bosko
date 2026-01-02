import { View, StyleSheet, Dimensions } from "react-native";
import React from "react";
import LogInView from "@/features/auth/screens/LogInView";
import RegisterView from "@/features/auth/screens/RegisterView";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function LoginIndex() {
  const [toLogin, setToLogin] = React.useState(false);
  const video = React.useRef(null);

  const handleLogin = () => {
    setToLogin(!toLogin);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Video
        ref={video}
        style={StyleSheet.absoluteFill}
        source={{
          uri: "https://www.pexels.com/es-es/download/video/6177737/",
        }}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
      />

      {/* Overlay darkening */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.contentContainer}>
        {toLogin ? (
          <RegisterView toLogin={handleLogin} />
        ) : (
          <LogInView toLogin={handleLogin} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});

import { View, Text, StyleSheet } from "react-native";
import React from "react";
import LottieView from "lottie-react-native";
import { globalStyles } from "@/src/shared/theme/global-styles";

export default function OnBoardingSlide({
  item,
}: {
  item: { image?: any; title: string; subtitle: string };
}) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={[globalStyles.title, { textAlign: "center" }]}>
        {item.title}
      </Text>
      {item.image ? (
        <LottieView
          source={item.image}
          autoPlay
          loop
          style={{ width: 300, height: 300 }}
        />
      ) : null}

      <Text
        style={[globalStyles.subtitle, { textAlign: "center", maxWidth: 300 }]}
      >
        {item.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderColor: "gray",
    borderWidth: 2,
    maxWidth: 200,
    width: "100%",
    textAlign: "center",
    borderRadius: 10,
    padding: 10,
  },
  progressBarWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 5,
  },
  title: {
    fontSize: 44,
    fontWeight: "bold",
    textAlign: "center",

    marginTop: 30,
    lineHeight: 50,

    letterSpacing: 0.1,
    color: globalStyles.colorPrimary,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});

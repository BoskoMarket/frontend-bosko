import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React from "react";
import { Image } from "expo-image";
import { Icon } from "react-native-paper";

export default function Header() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        gap: 10,
        width: "90%",
        alignSelf: "center",
        borderRadius: 10,
      }}
    >
      <Image
        source={require("@/assets/images/OIP.webp")}
        style={{ width: 50, height: 50, borderRadius: 25 }}
      />
      <View>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Francisco Yañez
        </Text>
        <Text style={{ color: "gray" }}>Dj</Text>
      </View>
      <TouchableOpacity style={{ marginLeft: "auto" }}>
        <Icon source="bell-outline" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
}

import { View } from "react-native";
import React from "react";
import LogInView from "@/src/auth/screens/LogInView";
import RegisterView from "@/src/auth/screens/RegisterView";

export default function Index() {
  const [toLogin, setToLogin] = React.useState(false);

  const handleLogin = () => {
    setToLogin(!toLogin);
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* <Text style={globalStyles.title}>Bosko</Text> */}
      {toLogin ? (
        <RegisterView toLogin={handleLogin} />
      ) : (
        <LogInView toLogin={handleLogin} />
      )}
    </View>
  );
}

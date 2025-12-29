import { View } from "react-native";
import React from "react";
import LogInView from "@/features/auth/screens/LogInView";
import RegisterView from "@/features/auth/screens/RegisterView";

export default function LoginIndex() {
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

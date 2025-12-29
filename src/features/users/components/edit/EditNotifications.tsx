import { View, Text, Switch, StyleSheet } from "react-native";
import React, { useState } from "react";

export default function EditNotifications() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);

  const save = () => {
    console.log("Notificaciones:", { push, email });
    // TODO: enviar al backend
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones</Text>

      <View style={styles.row}>
        <Text>Push notifications</Text>
        <Switch value={push} onValueChange={setPush} />
      </View>

      <View style={styles.row}>
        <Text>Notificaciones por email</Text>
        <Switch value={email} onValueChange={setEmail} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
});

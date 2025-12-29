import { View, TextInput, Button, StyleSheet } from "react-native";
import React, { useState } from "react";

export default function EditEmail() {
  const [email, setEmail] = useState("user@mail.com");

  const save = () => {
    console.log("Nuevo email:", email);
    // TODO: enviar al backend
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nuevo email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
});

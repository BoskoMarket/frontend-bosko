import { View, TextInput, Button, StyleSheet } from "react-native";
import React, { useState } from "react";

export default function EditUsername() {
  const [username, setUsername] = useState("usuarioActual");

  const save = () => {
    console.log("Nuevo username:", username);
    // acá llamás al backend
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
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

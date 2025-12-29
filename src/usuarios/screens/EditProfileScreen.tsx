import { View, TextInput, StyleSheet, Button } from "react-native";
import React, { useState } from "react";

export default function EditProfileScreen() {
  const [name, setName] = useState("Leo Gómez");
  const [email, setEmail] = useState("leo.gomez@mail.com");

  return (
    <View style={styles.container}>
      <TextInput value={name} onChangeText={setName} style={styles.input} />
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />
      <Button title="Guardar" onPress={() => console.log({ name, email })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  input: { borderBottomWidth: 1, marginBottom: 20, fontSize: 16 },
});

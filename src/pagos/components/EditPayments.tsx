import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState } from "react";

type PaymentMethod = {
  id: string;
  type: string;
  last4?: string;
};

export default function EditPayments() {
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: "1", type: "Visa", last4: "4242" },
    { id: "2", type: "MasterCard", last4: "1234" },
  ]);

  const addMethod = () => {
    // Aquí deberías abrir un flow de Stripe/PayPal/etc
    console.log("Agregar nuevo método de pago");
  };

  const removeMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métodos de pago</Text>
      {methods.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.text}>
            {m.type} {m.last4 ? `**** ${m.last4}` : ""}
          </Text>
          <TouchableOpacity onPress={() => removeMethod(m.id)}>
            <Text style={styles.remove}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addMethod} style={styles.btn}>
        <Text style={styles.btnText}>+ Agregar método de pago</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  text: { fontSize: 15 },
  remove: { color: "red", fontWeight: "500" },
  btn: {
    marginTop: 20,
    backgroundColor: "#850021",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});

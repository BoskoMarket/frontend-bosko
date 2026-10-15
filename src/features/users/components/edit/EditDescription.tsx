import { View, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { Button, Input } from '@/core/design-system';

export default function EditDescription() {
  const [desc, setDesc] = useState('Descripción actual');

  const save = () => {
    // acá llamás al backend
  };

  return (
    <View style={styles.container}>
      <Input value={desc} onChangeText={setDesc} multiline accessibilityLabel="Descripción" />
      <Button label="Guardar" onPress={save} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { TextInput } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { SlideInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Category } from "@/types/services";
import { CategoryDropdown } from "./CategoryDropdown";
import { Service } from "@/interfaces/service";
import { useServices } from "@/features/servicesUser/state/ServicesContext";
import Colors from "@/core/design-system/Colors";

interface EditServiceModalProps {
  visible: boolean;
  onClose: () => void;
  service: Service | null;
  isCreate: boolean;
}

export const EditServiceModal: React.FC<EditServiceModalProps> = ({
  visible,
  onClose,
  service,
  isCreate,
}) => {
  const { addService, editService, categories, fetchCategories } =
    useServices();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    image: "",
    category: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCategories(); // Ensure categories are loaded
      if (service && !isCreate) {
        // If service.category is an object, use its id, otherwise use the string
        const categoryId =
          typeof service.category === "object"
            ? service.category.id
            : service.category;

        setFormData({
          title: service.title,
          description: service.description || "",
          price: service.price?.toString() || "0",
          image: service.image || "",
          category: categoryId || "",
        });
        if (service.id) loadLocalImage(service.id);
      } else {
        setFormData({
          title: "",
          description: "",
          price: "",
          image: "",
          category: "",
        });
      }
    }
  }, [visible, service, isCreate]);

  const loadLocalImage = async (serviceId: string) => {
    try {
      const savedUri = await AsyncStorage.getItem(`service_image_${serviceId}`);
      if (savedUri) {
        setFormData((prev) => ({ ...prev, image: savedUri }));
      }
    } catch (e) {
      console.error("Failed to load image from storage", e);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (
      !formData.title ||
      !formData.price ||
      !formData.description ||
      (!formData.category && isCreate)
    ) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      const priceNum = parseFloat(formData.price);

      if (isCreate) {
        if (!formData.category) {
          Alert.alert("Error", "Debes seleccionar una categoría");
          return;
        }
        await addService({
          title: formData.title,
          description: formData.description,
          price: priceNum,
          category: formData.category,
          image: formData.image,
        });
      } else if (service?.id) {
        await editService(service.id, {
          title: formData.title,
          description: formData.description,
          price: priceNum,
          category: formData.category,
          image: formData.image,
        });
        // Save image locally as requested
        if (formData.image) {
          await AsyncStorage.setItem(
            `service_image_${service.id}`,
            formData.image
          );
        }
      }
      onClose();
    } catch (error) {
      console.error("Error saving service:", error);
      Alert.alert("Error", "No se pudo guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.modalContainer}
        >
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isCreate ? "Nuevo Servicio" : "Editar Servicio"}
                </Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.imageSection}>
                  <Pressable onPress={pickImage} style={styles.imagePicker}>
                    {formData.image ? (
                      <Image
                        source={{ uri: formData.image }}
                        style={styles.imagePreview}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialIcons
                          name="add-photo-alternate"
                          size={40}
                          color="rgba(255,255,255,0.5)"
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Añadir Foto
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                <View style={styles.form}>
                  <View style={{ zIndex: 100 }}>
                    <CategoryDropdown
                      categories={categories}
                      selectedId={formData.category}
                      onSelect={(id) =>
                        setFormData({ ...formData, category: id })
                      }
                      error={
                        !formData.category && isSaving
                          ? "Selecciona una categoría"
                          : undefined
                      }
                    />
                  </View>
                  <TextInput
                    label="Título"
                    value={formData.title}
                    onChangeText={(t) => setFormData({ ...formData, title: t })}
                    style={styles.input}
                    underlineColor={Colors.colorPrimary}
                    activeUnderlineColor={Colors.colorPrimary}
                    textColor={Colors.premium.textPrimary}
                    theme={{
                      colors: {
                        onSurfaceVariant: Colors.premium.textSecondary,
                      },
                    }}
                  />
                  <TextInput
                    label="Precio ($)"
                    value={formData.price}
                    onChangeText={(t) => setFormData({ ...formData, price: t })}
                    keyboardType="numeric"
                    style={styles.input}
                    underlineColor={Colors.colorPrimary}
                    activeUnderlineColor={Colors.colorPrimary}
                    textColor={Colors.premium.textPrimary}
                    theme={{
                      colors: {
                        onSurfaceVariant: Colors.premium.textSecondary,
                      },
                    }}
                  />
                  <TextInput
                    label="Descripción"
                    value={formData.description}
                    onChangeText={(t) =>
                      setFormData({ ...formData, description: t })
                    }
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                    underlineColor={Colors.colorPrimary}
                    activeUnderlineColor={Colors.colorPrimary}
                    textColor={Colors.premium.textPrimary}
                    theme={{
                      colors: {
                        onSurfaceVariant: Colors.premium.textSecondary,
                      },
                    }}
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    (isSaving ||
                      !formData.category ||
                      !formData.title ||
                      !formData.price ||
                      !formData.description) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleSave}
                  disabled={
                    isSaving ||
                    !formData.category ||
                    !formData.title ||
                    !formData.price ||
                    !formData.description
                  }
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Guardar</Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: {
    height: "90%",
    backgroundColor: Colors.premium.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalBlur: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.premium.borderSubtle,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.premium.textPrimary,
  },
  closeButton: { padding: 4 },
  content: { flex: 1 },
  imageSection: { alignItems: "center", padding: 20 },
  imagePicker: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.premium.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: Colors.premium.borderSubtle,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center" },
  imagePlaceholderText: { color: Colors.premium.textSecondary, marginTop: 8 },
  form: { padding: 20, gap: 16 },
  input: { backgroundColor: Colors.premium.inputBackground },
  textArea: { minHeight: 100 },
  label: {
    color: Colors.premium.textSecondary,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  categoryList: { gap: 8, paddingBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.premium.inputBackground,
    borderWidth: 1,
    borderColor: Colors.premium.borderSubtle,
  },
  categoryChipSelected: {
    backgroundColor: Colors.premium.gold,
    borderColor: Colors.premium.gold,
  },
  categoryChipText: { color: Colors.premium.textSecondary, fontSize: 13 },
  categoryChipTextSelected: { color: "#000", fontWeight: "bold" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  inputGroup: { gap: 4 },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.premium.borderSubtle,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.premium.borderSubtle,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.colorPrimary,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.5 },
  buttonText: {
    color: Colors.premium.textPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
});

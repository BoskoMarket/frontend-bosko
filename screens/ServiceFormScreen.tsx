import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useServices } from "@/src/contexts/ServicesContext";
import { useCategories } from "@/src/contexts/CategoriesContext";
import type { Service, ServicePayload } from "@/src/interfaces/service";

type FormState = {
  title: string;
  description: string;
  price: string;
  categoryId?: string;
  image?: string | null;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  categoryId: undefined,
  image: undefined,
};

const MIN_DESCRIPTION = 20;

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const extension = uri.split(".").pop()?.toLowerCase();
  const mimeType = extension === "png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

export default function ServiceFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const { services, loading, loadServices, fetchService, addService, editService } =
    useServices();
  const { categories, loading: categoriesLoading, loadCategories } = useCategories();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | undefined>();

  const isEditing = useMemo(() => !!selectedService, [selectedService]);

  useEffect(() => {
    if (categories.length === 0) {
      loadCategories().catch((err) => console.error(err));
    }
  }, [categories.length, loadCategories]);

  useEffect(() => {
    if (!params.serviceId && services.length === 0 && !loading) {
      loadServices().catch((err) => console.error(err));
    }
  }, [params.serviceId, services.length, loading, loadServices]);

  useEffect(() => {
    const serviceFromParam = params.serviceId
      ? services.find((service) => service.id === params.serviceId)
      : null;

    if (!serviceFromParam && params.serviceId) {
      fetchService(params.serviceId).catch((err) => console.error(err));
    }

    const serviceToLoad = serviceFromParam ?? services[0];
    const defaultCategory = serviceToLoad?.categoryId ?? categories[0]?.id;

    if (serviceToLoad) {
      setSelectedService(serviceToLoad);
      setForm({
        title: serviceToLoad.title ?? "",
        description: serviceToLoad.description ?? "",
        price: serviceToLoad.price ? String(serviceToLoad.price) : "",
        categoryId: defaultCategory,
        image: serviceToLoad.image,
      });
      setImageUri(serviceToLoad.image ?? undefined);
    } else {
      setSelectedService(null);
      setForm({ ...EMPTY_FORM, categoryId: defaultCategory });
      setImageUri(undefined);
    }
  }, [services, params.serviceId, categories]);

  const handleInputChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectCategory = (categoryId?: string) => {
    setForm((prev) => ({ ...prev, categoryId }));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tus fotos para seleccionar una imagen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const [asset] = result.assets;
      setImageUri(asset.uri);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return false;
    }

    if (form.description.trim().length < MIN_DESCRIPTION) {
      setError(`La descripción debe tener al menos ${MIN_DESCRIPTION} caracteres.`);
      return false;
    }

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError("El precio debe ser mayor a 0.");
      return false;
    }

    if (!form.categoryId) {
      setError("Selecciona una categoría");
      return false;
    }

    setError(null);
    return true;
  };

  const buildPayload = async (): Promise<ServicePayload> => {
    let imagePayload: string | null | undefined = form.image;

    if (imageUri && imageUri.startsWith("file")) {
      imagePayload = await imageToBase64(imageUri);
    } else if (imageUri) {
      imagePayload = imageUri;
    }

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      categoryId: form.categoryId,
      image: imagePayload ?? null,
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = await buildPayload();

      if (isEditing && selectedService?.id) {
        await editService(selectedService.id, payload);
        Alert.alert("Servicio actualizado", "Los cambios fueron guardados.");
      } else {
        await addService(payload);
        Alert.alert("Servicio creado", "Tu servicio fue publicado correctamente.");
      }

      router.back();
    } catch (err: any) {
      if (err?.message === "PLAN_LIMIT_REACHED") {
        Alert.alert("Plan Bosko", "Actualizar a plan Plus para más");
      } else {
        Alert.alert(
          "Error",
          err?.response?.data?.message || "No se pudo guardar el servicio"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = isEditing ? "Guardar cambios" : "Publicar servicio";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isEditing ? "Editar servicio" : "Publicar nuevo servicio"}
      </Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de tu servicio"
        value={form.title}
        onChangeText={(text) => handleInputChange("title", text)}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe en detalle tu servicio"
        value={form.description}
        multiline
        numberOfLines={4}
        onChangeText={(text) => handleInputChange("description", text)}
      />
      <Text style={styles.helper}>Mínimo {MIN_DESCRIPTION} caracteres.</Text>

      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        placeholder="Precio"
        keyboardType="numeric"
        value={form.price}
        onChangeText={(text) => handleInputChange("price", text.replace(/[^0-9.,]/g, ""))}
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categoriesContainer}>
        {categoriesLoading && categories.length === 0 ? (
          <ActivityIndicator />
        ) : categories.length === 0 ? (
          <Text style={styles.helper}>No hay categorías disponibles</Text>
        ) : (
          categories.map((category) => {
            const selected = form.categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => handleSelectCategory(category.id)}
              >
                <Text
                  style={[styles.categoryText, selected && styles.categoryTextSelected]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.label}>Foto</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewPlaceholderText}>
            Aún no has seleccionado una imagen
          </Text>
        </View>
      )}

      <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
        <Text style={styles.secondaryButtonText}>Elegir imagen</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submitButton, (submitting || categoriesLoading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || categoriesLoading}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>

      {loading && !isEditing ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2933",
  },
  helper: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: -6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  categoryChipSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    color: "#1F2933",
    fontSize: 14,
  },
  categoryTextSelected: {
    color: "#fff",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  previewPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
  },
  previewPlaceholderText: {
    color: "#6B7280",
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
  },
  loader: {
    marginTop: 16,
  },
});

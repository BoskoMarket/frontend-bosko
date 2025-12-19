import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { TextInput } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { SlideInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/Colors";
import { UpdateProfilePayload } from "@/services/profile";

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: UpdateProfilePayload) => Promise<void>;
    initialData: {
        firstName: string;
        lastName?: string;
        bio?: string;
        location?: string;
    };
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData,
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field: keyof UpdateProfilePayload, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName?.trim()) newErrors.firstName = "El nombre es obligatorio";
        if (formData.bio && formData.bio.length > 200) newErrors.bio = "La biografía no puede exceder 200 caracteres";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData(initialData);
        setErrors({});
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={handleClose} />
                {/* Full screen feel modal */}
                <Animated.View entering={SlideInDown.springify()} style={styles.modalContainer}>
                    <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
                        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Editar Perfil</Text>
                                <Pressable onPress={handleClose} style={styles.closeButton}>
                                    <MaterialIcons name="close" size={24} color={Colors.premium.textPrimary} />
                                </Pressable>
                            </View>

                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                <View style={styles.formSection}>
                                    <Text style={styles.sectionTitle}>Información Personal</Text>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            label="Nombre"
                                            mode="flat"
                                            value={formData.firstName}
                                            onChangeText={(v) => handleChange("firstName", v)}
                                            style={styles.input}
                                            textColor={Colors.premium.textPrimary}
                                            theme={{ colors: { onSurfaceVariant: Colors.premium.textSecondary } }}
                                            underlineColor={Colors.colorPrimary}
                                            activeUnderlineColor={Colors.colorPrimary}
                                            error={!!errors.firstName}
                                        />
                                        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            label="Apellido"
                                            mode="flat"
                                            value={formData.lastName}
                                            onChangeText={(v) => handleChange("lastName", v)}
                                            style={styles.input}
                                            textColor={Colors.premium.textPrimary}
                                            theme={{ colors: { onSurfaceVariant: Colors.premium.textSecondary } }}
                                            underlineColor={Colors.colorPrimary}
                                            activeUnderlineColor={Colors.colorPrimary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            label="Ubicación"
                                            mode="flat"
                                            value={formData.location}
                                            onChangeText={(v) => handleChange("location", v)}
                                            style={styles.input}
                                            textColor={Colors.premium.textPrimary}
                                            theme={{ colors: { onSurfaceVariant: Colors.premium.textSecondary } }}
                                            underlineColor={Colors.colorPrimary}
                                            activeUnderlineColor={Colors.colorPrimary}
                                            placeholder="Ciudad, País"
                                            placeholderTextColor={Colors.premium.textTertiary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            label="Biografía"
                                            mode="flat"
                                            value={formData.bio}
                                            onChangeText={(v) => handleChange("bio", v)}
                                            style={[styles.input, styles.bioInput]}
                                            textColor={Colors.premium.textPrimary}
                                            theme={{ colors: { onSurfaceVariant: Colors.premium.textSecondary } }}
                                            underlineColor={Colors.colorPrimary}
                                            activeUnderlineColor={Colors.colorPrimary}
                                            multiline
                                            numberOfLines={4}
                                            maxLength={200}
                                            error={!!errors.bio}
                                        />
                                        <Text style={styles.charCount}>{formData.bio?.length || 0}/200</Text>
                                        {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
                                    </View>
                                </View>

                                <View style={styles.formSection}>
                                    <View style={styles.sectionHeader}>
                                        <MaterialIcons name="security" size={20} color={Colors.colorPrimary} />
                                        <Text style={styles.sectionTitle}>Seguridad</Text>
                                    </View>
                                    <View style={styles.securityCard}>
                                        <Text style={styles.securityText}>Para cambiar tu contraseña o correo, por favor contacta a soporte o usa la versión web por seguridad.</Text>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Footer Actions */}
                            <View style={styles.footer}>
                                <Pressable style={styles.cancelButton} onPress={handleClose}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Cambios</Text>}
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
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject },
    modalContainer: { height: "95%", backgroundColor: Colors.premium.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
    modalBlur: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.premium.borderSubtle },
    title: { fontSize: 24, fontWeight: "bold", color: Colors.colorPrimary },
    closeButton: { padding: 8, backgroundColor: Colors.premium.borderSubtle, borderRadius: 20 },
    content: { flex: 1, padding: 20 },
    formSection: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    sectionTitle: { color: Colors.premium.textPrimary, fontSize: 18, fontWeight: "600", marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    input: { backgroundColor: Colors.premium.inputBackground, fontSize: 16 },
    bioInput: { minHeight: 100 },
    charCount: { alignSelf: "flex-end", color: Colors.premium.textTertiary, fontSize: 12, marginTop: 4 },
    errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
    securityCard: { padding: 16, backgroundColor: Colors.premium.goldLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.premium.goldBorder },
    securityText: { color: Colors.premium.textSecondary, fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: "row", padding: 20, gap: 16, borderTopWidth: 1, borderTopColor: Colors.premium.borderSubtle, backgroundColor: "rgba(0,0,0,0.2)" },
    cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: Colors.premium.borderSubtle, alignItems: "center" },
    cancelButtonText: { color: Colors.premium.textPrimary, fontWeight: "600" },
    saveButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: Colors.colorPrimary, alignItems: "center" },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: Colors.premium.textPrimary, fontWeight: "bold", fontSize: 16 },
});

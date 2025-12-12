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

        if (!formData.firstName?.trim()) {
            newErrors.firstName = "El nombre es obligatorio";
        }

        if (formData.bio && formData.bio.length > 200) {
            newErrors.bio = "La biografía no puede exceder 200 caracteres";
        }

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
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={handleClose} />

                <Animated.View
                    entering={SlideInDown.springify()}
                    style={styles.modalContainer}
                >
                    <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : undefined}
                            style={styles.keyboardView}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Editar Perfil</Text>
                                <Pressable
                                    onPress={handleClose}
                                    style={({ pressed }) => [
                                        styles.closeButton,
                                        pressed && styles.closeButtonPressed,
                                    ]}
                                >
                                    <MaterialIcons name="close" size={24} color={Colors.white} />
                                </Pressable>
                            </View>

                            {/* Form */}
                            <ScrollView
                                style={styles.scrollView}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.form}>
                                    <TextInput
                                        label="Nombre"
                                        mode="flat"
                                        value={formData.firstName}
                                        onChangeText={(value) => handleChange("firstName", value)}
                                        style={styles.input}
                                        error={Boolean(errors.firstName)}
                                        underlineColor={Colors.colorPrimary}
                                        activeUnderlineColor={Colors.colorPrimary}
                                    />
                                    {errors.firstName && (
                                        <Text style={styles.errorText}>{errors.firstName}</Text>
                                    )}

                                    <TextInput
                                        label="Apellido"
                                        mode="flat"
                                        value={formData.lastName}
                                        onChangeText={(value) => handleChange("lastName", value)}
                                        style={styles.input}
                                        underlineColor={Colors.colorPrimary}
                                        activeUnderlineColor={Colors.colorPrimary}
                                    />

                                    <TextInput
                                        label="Ubicación"
                                        mode="flat"
                                        value={formData.location}
                                        onChangeText={(value) => handleChange("location", value)}
                                        style={styles.input}
                                        placeholder="Ciudad, País"
                                        underlineColor={Colors.colorPrimary}
                                        activeUnderlineColor={Colors.colorPrimary}
                                    />

                                    <TextInput
                                        label="Biografía"
                                        mode="flat"
                                        value={formData.bio}
                                        onChangeText={(value) => handleChange("bio", value)}
                                        style={[styles.input, styles.bioInput]}
                                        multiline
                                        numberOfLines={4}
                                        maxLength={200}
                                        placeholder="Cuéntanos sobre ti..."
                                        error={Boolean(errors.bio)}
                                        underlineColor={Colors.colorPrimary}
                                        activeUnderlineColor={Colors.colorPrimary}
                                    />
                                    <View style={styles.charCount}>
                                        <Text style={styles.charCountText}>
                                            {formData.bio?.length || 0}/200
                                        </Text>
                                    </View>
                                    {errors.bio && (
                                        <Text style={styles.errorText}>{errors.bio}</Text>
                                    )}
                                </View>
                            </ScrollView>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.cancelButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={handleClose}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.saveButton,
                                        pressed && styles.buttonPressed,
                                        isSaving && styles.saveButtonDisabled,
                                    ]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Guardar</Text>
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        maxHeight: "85%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    modalBlur: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.white,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeButtonPressed: {
        opacity: 0.7,
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 20,
        gap: 16,
    },
    input: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    bioInput: {
        minHeight: 100,
    },
    charCount: {
        alignItems: "flex-end",
        marginTop: -12,
    },
    charCountText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.5)",
    },
    errorText: {
        color: "#EF4444",
        fontSize: 12,
        marginTop: -8,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
    },
    cancelButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.colorPrimary,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    buttonPressed: {
        opacity: 0.8,
    },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Category } from "@/types/services";

interface CategoryDropdownProps {
    categories: Category[];
    selectedId: string;
    onSelect: (id: string) => void;
    error?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
    categories,
    selectedId,
    onSelect,
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const rotation = useSharedValue(0);
    const height = useSharedValue(0);

    const apiToIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
        "Limpieza": "cleaning-services",
        "Reparación": "build",
        "Jardinería": "yard",
        "Plomería": "plumbing",
        "Electricidad": "electrical-services",
        "Pintura": "format-paint",
        "Mudanza": "local-shipping",
        // Add defaults or mappings as needed
    };

    const getIconName = (categoryName: string, categoryIcon?: string): keyof typeof MaterialIcons.glyphMap => {
        // Try direct mapping from API icon name if valid
        if (categoryIcon && Object.keys(MaterialIcons.glyphMap).includes(categoryIcon)) {
            return categoryIcon as keyof typeof MaterialIcons.glyphMap;
        }
        // Fallback to title mapping or default
        return apiToIconMap[categoryName] || "category";
    };

    const selectedCategory = categories.find((c) => c.id === selectedId);

    const toggleDropdown = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        rotation.value = withSpring(nextState ? 180 : 0);
        height.value = withTiming(nextState ? 200 : 0, { duration: 300 }); // Max height of dropdown
    };

    const handleSelect = (id: string) => {
        onSelect(id);
        toggleDropdown();
    };

    const arrowStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const listStyle = useAnimatedStyle(() => ({
        height: height.value,
        opacity: interpolate(height.value, [0, 20], [0, 1], Extrapolate.CLAMP),
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Categoría</Text>

            <Pressable
                style={[styles.trigger, error ? styles.triggerError : null]}
                onPress={toggleDropdown}
            >
                <View style={styles.triggerContent}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons
                            name={selectedCategory ? getIconName(selectedCategory.name, selectedCategory.icon) : "category"}
                            size={20}
                            color={selectedCategory ? Colors.premium.gold : Colors.premium.textSecondary}
                        />
                    </View>
                    <Text style={[styles.triggerText, !selectedCategory && styles.placeholderText]}>
                        {selectedCategory ? selectedCategory.name : "Selecciona una categoría"}
                    </Text>
                </View>
                <Animated.View style={arrowStyle}>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.premium.textSecondary} />
                </Animated.View>
            </Pressable>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Animated.View style={[styles.dropdownContainer, listStyle]}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {categories.map((cat) => {
                        const isSelected = cat.id === selectedId;
                        return (
                            <Pressable
                                key={cat.id}
                                style={[styles.item, isSelected && styles.itemSelected]}
                                onPress={() => handleSelect(cat.id)}
                            >
                                <View style={styles.itemContent}>
                                    <MaterialIcons
                                        name={getIconName(cat.name, cat.icon)}
                                        size={18}
                                        color={isSelected ? Colors.premium.background : Colors.premium.textSecondary}
                                    />
                                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                                        {cat.name}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <MaterialIcons name="check" size={18} color={Colors.premium.background} />
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 10, // Ensure dropdown floats above other elements if needed, though pushing content is safer
        marginBottom: 8,
    },
    label: {
        color: Colors.premium.textSecondary,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.premium.inputBackground,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.premium.borderSubtle,
    },
    triggerError: {
        borderColor: "#EF4444",
    },
    triggerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 215, 0, 0.1)", // Gold with opacity
        justifyContent: "center",
        alignItems: "center",
    },
    triggerText: {
        fontSize: 16,
        color: Colors.premium.textPrimary,
        fontWeight: "500",
    },
    placeholderText: {
        color: Colors.premium.textSecondary,
    },
    dropdownContainer: {
        overflow: "hidden",
        marginTop: 8,
        backgroundColor: Colors.premium.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.premium.borderSubtle,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.premium.borderSubtle,
    },
    itemSelected: {
        backgroundColor: Colors.premium.gold,
    },
    itemContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    itemText: {
        fontSize: 15,
        color: Colors.premium.textPrimary,
    },
    itemTextSelected: {
        color: Colors.premium.background,
        fontWeight: "bold",
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});

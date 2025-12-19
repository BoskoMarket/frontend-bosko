import React from "react";
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useServices } from "@/context/ServicesContext";
import Colors from "@/constants/Colors";
import { Service } from "@/services/service";
import { EditServiceModal } from "./EditServiceModal";

export const ProfileServices: React.FC = () => {
    const { myServices, myServicesLoading } = useServices();
    const [selectedService, setSelectedService] = React.useState<Service | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
    const [isCreateMode, setIsCreateMode] = React.useState(false);

    const handleEditService = (service: Service) => {
        setSelectedService(service);
        setIsCreateMode(false);
        setIsEditModalVisible(true);
    };

    const handleAddService = () => {
        setSelectedService(null);
        setIsCreateMode(true);
        setIsEditModalVisible(true);
    };

    const renderServiceCard = (service: Service) => (
        <Pressable
            key={service.id}
            style={styles.card}
            onPress={() => handleEditService(service)}
        >
            <Image
                source={{ uri: service.image || "https://via.placeholder.com/150" }}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {service.title}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>${service.price}</Text>
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                            {(service as any).averageRating?.toFixed(1) || "New"}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    const renderContent = () => {
        if (myServicesLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando servicios...</Text>
                </View>
            );
        }

        if (myServices.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tienes servicios publicados</Text>
                    <Pressable style={styles.addButton} onPress={handleAddService}>
                        <Text style={styles.addButtonText}>Añadir Servicio</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {/* Always show Add Card first in list? Or just button in header? User asked for button if empty. 
                    Let's maybe add a small "Add" card at start of list too if list flows. */}
                <Pressable style={[styles.card, styles.addCard]} onPress={handleAddService}>
                    <MaterialIcons name="add" size={40} color={Colors.colorPrimary} />
                    <Text style={styles.addCardText}>Añadir</Text>
                </Pressable>
                {myServices.map(renderServiceCard)}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mis Servicios</Text>
                <Pressable onPress={() => { }}>
                    <Text style={styles.seeAll}>Ver todos</Text>
                </Pressable>
            </View>

            {renderContent()}

            <EditServiceModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                service={selectedService}
                isCreate={isCreateMode}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    seeAll: {
        fontSize: 14,
        color: Colors.colorPrimary,
        fontWeight: "600",
    },
    loadingContainer: {
        padding: 20,
        alignItems: "center",
    },
    loadingText: {
        color: "#64748b",
    },
    emptyContainer: {
        padding: 20,
        alignItems: "center",
    },
    emptyText: {
        color: "#64748b",
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        width: 160,
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    cardImage: {
        width: "100%",
        height: 100,
        backgroundColor: "#f1f5f9",
    },
    cardContent: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.colorPrimary,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    addButton: {
        marginTop: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.colorPrimary,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    addCard: {
        justifyContent: "center",
        alignItems: "center",
        borderStyle: "dashed",
        borderColor: Colors.colorPrimary,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
    },
    addCardText: {
        marginTop: 8,
        color: Colors.colorPrimary,
        fontWeight: "600",
    },
})

import { StyleSheet } from "react-native";
import Colors from "@/core/design-system/Colors";

const styles = StyleSheet.create({
    textError: {
        color: '#FF6B6B',
        fontSize: 13,
        marginTop: 4,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 30,
        color: Colors.colorPrimary,
    },
    subtitle: {
        fontFamily: 'Inter-bold',
        fontSize: 20,
        color: '#333',
        marginBottom: 10,
    },
    input: {
        width: 300,
        borderRadius: 10,
        marginVertical: 5,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 40,
        backgroundColor: "white",
        borderRadius: 100,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.colorPrimary,
        shadowColor: "rgba(0, 0, 0, 0.25)",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 6,
    }
});

export const globalStyles = {
    colorPrimary: '#85001B',
    colorSecondary: '#DB0C36',
    ...styles
};





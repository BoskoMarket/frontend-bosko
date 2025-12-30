import { CustomTabBar } from "@/components/CustomTabBar";
import { SearchPage } from "@/src/features/search/SearchPage";
import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchRoute() {
    const state = useLocalSearchParams();
    const descriptors = useLocalSearchParams();
    const navigation = useLocalSearchParams();
    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

                <Stack.Screen options={{ headerShown: false }} />

                <SearchPage />

            </SafeAreaView>
        </>
    );
}

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useCategories } from '@/src/contexts/CategoriesContext';
import { Category } from '@/src/interfaces/category';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 300;

interface VideoCategoryCardProps {
    category: Category;
    index: number;
    onPress: (category: Category) => void;
}

const VideoCategoryCard: React.FC<VideoCategoryCardProps> = ({ category, index, onPress }) => {
    const video = useRef<Video>(null);
    const scale = useSharedValue(1);

    // Placeholder videos - ideally these come from the backend/category data
    // Using a few different nature/tech abstract loops for demo
    const videoSources = [
        // Using "uc?export=download" to try and get a direct stream from Google Drive
        // Note: Google Drive is not recommended for video streaming in production due to quotas and performance.
        "https://www.pexels.com/es-es/download/video/6755152/",
        "https://www.pexels.com/es-es/download/video/6755152/",
        "https://www.pexels.com/es-es/download/video/6755152/",
        "https://www.pexels.com/es-es/download/video/6755152/"
    ];

    const source = { uri: category.video || videoSources[index % videoSources.length] };

    console.log(source);


    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
            <Pressable
                onPress={() => {
                    scale.value = withSpring(0.95, {}, () => {
                        scale.value = withSpring(1);
                    });
                    onPress(category);
                }}
                style={styles.pressable}
            >
                <View style={styles.videoWrapper}>
                    <Video
                        ref={video}
                        style={styles.video}
                        source={source}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay
                        isMuted={true}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                    <View style={styles.content}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.serviceCount}>
                            Explorar
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

export const CategoryVideoCarousel = ({ onSelectCategory }: { onSelectCategory?: (id: string) => void }) => {
    const { categories } = useCategories();

    // Limit to first 6 for performance in carousel
    const displayCategories = categories.slice(0, 6);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Categorías Populares</Text>
                <Text style={styles.subtitle}>Desliza para ver más</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 12}
            >
                {displayCategories.map((cat, index) => (
                    <VideoCategoryCard
                        key={cat.id}
                        category={cat}
                        index={index}
                        onPress={(c) => onSelectCategory?.(c.id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.colorPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.dark.text,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
        paddingVertical: 22,
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        backgroundColor: Colors.premium.card, // Required for shadow/elevation on Android
        ...Colors.premium.shadows.global,
    },
    pressable: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: Colors.premium.card,
    },
    videoWrapper: {
        flex: 1,
        position: 'relative',
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    categoryName: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    serviceCount: {
        color: Colors.premium.gold,
        fontSize: 12,
        fontWeight: '600',
    }
});

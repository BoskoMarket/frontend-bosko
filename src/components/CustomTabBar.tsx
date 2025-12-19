
import React from 'react';
import { View, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const TAB_HEIGHT = 60;
const CURVE_WIDTH = 80;
const CURVE_DEPTH = 35; // How deep the curve goes
const CENTER = width / 2;
const SIDE_MARGIN = 20; // Margin from screen edges
const RADIUS = 35; // Corner radius for the pill

const TabBarBackground = () => {
    // Path: Rounded Pill with top-center curve
    // Drawing area: from (SIDE_MARGIN) to (width - SIDE_MARGIN)
    const START_X = SIDE_MARGIN;
    const END_X = width - SIDE_MARGIN;

    const path = `
        M ${START_X + RADIUS} 0
        L ${CENTER - CURVE_WIDTH / 2} 0
        C ${CENTER - CURVE_WIDTH / 4} 0, ${CENTER - CURVE_WIDTH / 4} ${CURVE_DEPTH}, ${CENTER} ${CURVE_DEPTH}
        C ${CENTER + CURVE_WIDTH / 4} ${CURVE_DEPTH}, ${CENTER + CURVE_WIDTH / 4} 0, ${CENTER + CURVE_WIDTH / 2} 0
        L ${END_X - RADIUS} 0
        Q ${END_X} 0, ${END_X} ${RADIUS}
        L ${END_X} ${TAB_HEIGHT - RADIUS}
        Q ${END_X} ${TAB_HEIGHT}, ${END_X - RADIUS} ${TAB_HEIGHT}
        L ${START_X + RADIUS} ${TAB_HEIGHT}
        Q ${START_X} ${TAB_HEIGHT}, ${START_X} ${TAB_HEIGHT - RADIUS}
        L ${START_X} ${RADIUS}
        Q ${START_X} 0, ${START_X + RADIUS} 0
        Z
    `;

    return (
        <Svg width={width} height={TAB_HEIGHT} style={styles.svg}>
            <Defs>
                <LinearGradient id="grad" x1="0.5" y1="0" x2="0.5" y2="1">
                    <Stop offset="0" stopColor="#3d0a0f" stopOpacity="1" />
                    <Stop offset="0.5" stopColor={Colors.colorPrimary} stopOpacity="1" />
                    <Stop offset="1" stopColor="#3d0a0f" stopOpacity="1" />
                </LinearGradient>
            </Defs>
            {/* Shadow path (rendered slightly offset if needed, or rely on container shadow) */}

            {/* Main Path */}
            <Path
                d={path}
                fill="url(#grad)"
                stroke="rgba(0, 0, 0, 0.2)" // Gold border
                strokeWidth="1"
            />
        </Svg>
    );
};

const TabIcon = ({ name, isFocused, isCenter }: { name: any, isFocused: boolean, isCenter?: boolean }) => {
    const scale = useSharedValue(isCenter ? 1 : (isFocused ? 1.2 : 1));
    const opacity = useSharedValue(isFocused ? 1 : 0.6);

    React.useEffect(() => {
        scale.value = withSpring(isCenter ? 1 : (isFocused ? 1.2 : 1));
        opacity.value = withTiming(isFocused ? 1 : 0.6);
    }, [isFocused, isCenter]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: isCenter ? 1 : opacity.value // Center icon always full opacity
    }));

    if (isCenter) {
        return (
            <View style={styles.centerButtonContainer}>
                <View style={[styles.centerButton, {
                    // Gold glow for center button
                    ...Colors.premium.shadows.global
                }]}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </View>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <Ionicons
                name={name}
                size={24}
                color={isFocused ? Colors.premium.gold : Colors.premium.textPrimary}
            />
            {isFocused && (
                <View style={styles.indicator} />
            )}
        </Animated.View>
    );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: 0 }]}>
            {/* Background Container with Shadow */}
            <View style={styles.backgroundContainer}>
                {/*  We use a dedicated View for the overall drop shadow behind the SVG */}
                <View style={styles.shadowTarget}>
                    <TabBarBackground />
                </View>
            </View>

            <View style={styles.contentContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key] as { options: any };
                    // console.log(options); // Removed console.log as per instructions

                    // Skip hidden tabs or tabs explicitly excluded
                    if (options.href === null) return null;

                    // Removed label logic as it's not used in the new structure for icons

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    // Map route names to icons
                    let iconName: any = 'square';
                    if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
                    if (route.name === 'services') iconName = isFocused ? 'grid' : 'grid-outline';
                    // Center item usually
                    if (route.name === 'reels') iconName = 'add'; // We treat this as the + button visually
                    if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';
                    if (route.name === 'chat') iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';

                    // Center button logic: Middle index (2) in a zero-indexed 5-item list
                    const isCenter = index === 2;

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={[styles.tabItem, isCenter && styles.centerTabItem]}
                        >
                            <TabIcon
                                name={iconName}
                                isFocused={isFocused}
                                isCenter={isCenter}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        height: TAB_HEIGHT, // Reserve space
        alignItems: 'center',
        justifyContent: 'center',
        // Removed width 80% and margin hacks to ensure full width container for SVG
    },
    backgroundContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_HEIGHT,
        alignItems: 'center',
    },
    shadowTarget: {
        // Apply global shadow to the SVG container
        shadowColor: Colors.premium.shadows.global.shadowColor,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 20,
        backgroundColor: 'transparent', // Important for shadow to wrap shape? No, usually shadow needs a bg. 
        // Note: Generic View shadow on SVG works on iOS, Android might just shadow the box.
        // For Android exact shape shadow, one would need a duplicate dark SVG layer behind.
        // For now, let's rely on standard elevation which might box-shadow.
    },
    svg: {
        // backgroundColor: 'transparent'
    },
    contentContainer: {
        flexDirection: 'row',
        height: TAB_HEIGHT,
        alignItems: 'center',
        paddingHorizontal: 20, // Match the visual margin of the bar
        paddingBottom: 10, // Adjust for icon alignment
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        marginTop: 10 // Push icons down a bit into the bar
    },
    centerTabItem: {
        marginTop: -25, // Pull center item up
        justifyContent: 'flex-start',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // Optional: Add subtle drop shadow to icons for floating effect inside the "cave"
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,

    },
    centerButtonContainer: {
        width: 60,
        height: 60,
        // Removed manual margins
        // No explicit bg here, the round button has it
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.colorPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.premium.gold,
        left: 30,
        top: -15,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.premium.gold,
        marginTop: 4,
        shadowColor: Colors.premium.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    }
});

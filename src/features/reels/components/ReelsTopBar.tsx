import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONT_FAMILY, TOKENS } from '@/core/design-system';

export type FeedTab = 'siguiendo' | 'parati';

export const REEL_UPLOAD_ROUTE = '/(tabs)/profile/upload-reel';

/**
 * Overlay bar of the reels feed: "Siguiendo / Para ti" tabs, search on the right and,
 * for providers only (the backend rejects uploads from clients), a "+" to publish a reel.
 */
export function ReelsTopBar({
  insetTop,
  tab,
  setTab,
  canUpload,
}: {
  insetTop: number;
  tab: FeedTab;
  setTab: (t: FeedTab) => void;
  canUpload: boolean;
}) {
  return (
    <View style={[s.topBar, { paddingTop: insetTop + 8 }]} pointerEvents="box-none">
      {canUpload ? (
        <Pressable
          style={s.topUpload}
          pointerEvents="auto"
          onPress={() => router.push(REEL_UPLOAD_ROUTE)}
          accessibilityRole="button"
          accessibilityLabel="Publicar reel"
          hitSlop={8}
        >
          <Ionicons name="add-circle-outline" size={26} color={TOKENS.onMedia.icon} />
        </Pressable>
      ) : null}
      <View style={s.topTabs} pointerEvents="auto">
        <Pressable onPress={() => setTab('siguiendo')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'siguiendo' }}>
          <Text style={[s.topTab, tab === 'siguiendo' && s.topTabActive]}>Siguiendo</Text>
        </Pressable>
        <View style={s.topDivider} />
        <Pressable onPress={() => setTab('parati')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'parati' }}>
          <Text style={[s.topTab, tab === 'parati' && s.topTabActive]}>Para ti</Text>
        </Pressable>
      </View>
      <Pressable
        style={s.topSearch}
        pointerEvents="auto"
        onPress={() => router.push('/search')}
        accessibilityRole="button"
        accessibilityLabel="Buscar"
        hitSlop={8}
      >
        <Ionicons name="search" size={22} color={TOKENS.onMedia.icon} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topDivider: {
    width: 1,
    height: 16,
    backgroundColor: TOKENS.onMedia.border,
  },
  topTab: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.headingMedium,
    color: TOKENS.onMedia.textMuted,
  },
  topTabActive: {
    color: TOKENS.onMedia.text,
    textDecorationLine: 'underline',
    textDecorationColor: TOKENS.onMedia.text,
  },
  topUpload: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  topSearch: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
});

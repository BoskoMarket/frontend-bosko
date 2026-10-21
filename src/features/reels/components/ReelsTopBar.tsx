import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SPACING, TOKENS, Text } from '@/core/design-system';
import { REEL_UPLOAD_ROUTE } from '@/features/reels/routes';

export type FeedTab = 'siguiendo' | 'parati';

/** Width reserved on each side for the absolute "+" / search buttons (icon 26 + padding 2*xs). */
const ADD_ICON_SIZE = 26;
const SIDE_SLOT = ADD_ICON_SIZE + SPACING.xs * 2;

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
    <View style={[s.topBar, { paddingTop: insetTop + SPACING.sm }]} pointerEvents="box-none">
      {canUpload ? (
        <Pressable
          style={s.topUpload}
          pointerEvents="auto"
          onPress={() => router.push(REEL_UPLOAD_ROUTE)}
          accessibilityRole="button"
          accessibilityLabel="Publicar reel"
          hitSlop={8}
        >
          <Ionicons name="add-circle-outline" size={ADD_ICON_SIZE} color={TOKENS.onMedia.icon} />
        </Pressable>
      ) : null}
      <View style={s.topTabs} pointerEvents="auto">
        <Pressable onPress={() => setTab('siguiendo')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'siguiendo' }}>
          <Text variant="subtitle" color={TOKENS.onMedia.textMuted} style={tab === 'siguiendo' ? s.topTabActive : undefined}>Siguiendo</Text>
        </Pressable>
        <View style={s.topDivider} />
        <Pressable onPress={() => setTab('parati')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'parati' }}>
          <Text variant="subtitle" color={TOKENS.onMedia.textMuted} style={tab === 'parati' ? s.topTabActive : undefined}>Para ti</Text>
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
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    flexShrink: 1,
    marginHorizontal: SIDE_SLOT,
  },
  topDivider: {
    width: 1,
    height: SPACING.lg,
    backgroundColor: TOKENS.onMedia.border,
  },
  topTabActive: {
    color: TOKENS.onMedia.text,
    textDecorationLine: 'underline',
    textDecorationColor: TOKENS.onMedia.text,
  },
  topUpload: {
    position: 'absolute',
    left: SPACING.lg,
    padding: SPACING.xs,
  },
  topSearch: {
    position: 'absolute',
    right: SPACING.lg,
    padding: SPACING.xs,
  },
});

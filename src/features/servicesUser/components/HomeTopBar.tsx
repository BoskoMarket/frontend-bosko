import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/BrandMark';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { useNotifications } from '@/features/notifications/state/NotificationsContext';
import { openNotifications } from '@/stores/notificationsUI.store';
import { Badge, SPACING, useThemeColors } from '@/core/design-system';

/** Home header: brand lockup, profile zone (when the profile has one) and the notifications bell with unread dot. */
export function HomeTopBar() {
  const tc = useThemeColors();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.bar}>
      <BrandMark variant="lockup" size={30} />
      <View style={styles.right}>
        {profile?.location ? <Badge label={profile.location} icon="location-outline" tone="neutral" /> : null}
        <Pressable
          onPress={openNotifications}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? 'Notificaciones, hay nuevas' : 'Notificaciones'}
          style={[styles.bell, { backgroundColor: tc.surface2, borderColor: tc.border }]}
        >
          <Ionicons name="notifications-outline" size={18} color={tc.text} />
          {unreadCount > 0 ? <View style={[styles.dot, { backgroundColor: tc.signal, borderColor: tc.bg }]} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  bell: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
});

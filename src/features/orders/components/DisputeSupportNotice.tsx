import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NoticeBanner, SPACING } from '@/core/design-system';
import { SupportContactButton } from '@/features/appConfig/components/SupportContactButton';

interface DisputeSupportNoticeProps {
  orderId: string;
  /** The block only exists for disputed orders. */
  status: string;
}

export const disputeSupportMessage = (orderId: string) => `Tengo una disputa en la orden ${orderId}.`;

/** Next step for a disputed order: support reviews the case and reaches out over WhatsApp. */
export function DisputeSupportNotice({ orderId, status }: DisputeSupportNoticeProps) {
  if (status !== 'disputed') return null;
  return (
    <View style={styles.container}>
      <NoticeBanner variant="pending">
        Soporte revisará el caso. Te contactaremos por WhatsApp.
      </NoticeBanner>
      <SupportContactButton message={disputeSupportMessage(orderId)} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
});

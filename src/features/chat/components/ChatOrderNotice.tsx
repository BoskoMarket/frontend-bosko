import React from 'react';
import type { ViewStyle } from 'react-native';
import { NoticeBanner } from '@/core/design-system';
import type { OrderStatus } from '@/features/orders/types/orders.types';
import { chatNoticeFor } from '../constants/chatOrderRules';

interface Props {
  status: OrderStatus | undefined | null;
  style?: ViewStyle;
}

/** Banner explaining how the order status affects the chat (read-only / dispute). */
export function ChatOrderNotice({ status, style }: Props) {
  const notice = chatNoticeFor(status);
  if (!notice) return null;
  return (
    <NoticeBanner
      variant={notice.kind === 'readOnly' ? 'info' : 'pending'}
      icon={notice.kind === 'readOnly' ? 'lock-closed-outline' : 'alert-circle-outline'}
      style={style}
    >
      {notice.message}
    </NoticeBanner>
  );
}

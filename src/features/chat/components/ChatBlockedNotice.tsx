import React from 'react';
import type { ViewStyle } from 'react-native';
import { NoticeBanner } from '@/core/design-system';
import { chatBlockNotice, type ChatBlockState } from '../constants/chatBlockRules';

interface Props {
  state: ChatBlockState;
  style?: ViewStyle;
}

/** Banner shown in place of the composer when either side blocked the other. */
export function ChatBlockedNotice({ state, style }: Props) {
  const message = chatBlockNotice(state);
  if (!message) return null;
  return (
    <NoticeBanner variant="info" icon="ban-outline" style={style}>
      {message}
    </NoticeBanner>
  );
}

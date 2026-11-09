import React, { useMemo } from 'react';
import { OptionSheet, type OptionSheetOption } from '@/core/design-system';

export type ChatAction = 'report' | 'block' | 'unblock';

interface Props {
  visible: boolean;
  /** First name (or full name) of the other participant. */
  otherName: string;
  /** Report is hidden when the user cannot report (e.g. unknown participant). */
  canReport: boolean;
  /** Whether the current user already blocked the other participant. */
  blockedByMe: boolean;
  onSelect: (action: ChatAction) => void;
  onClose: () => void;
}

/** ⋯ menu of the chat: report the other participant, block / unblock them. */
export function ChatActionsSheet({ visible, otherName, canReport, blockedByMe, onSelect, onClose }: Props) {
  const options = useMemo<OptionSheetOption[]>(() => {
    const list: OptionSheetOption[] = [];
    if (canReport) list.push({ id: 'report', label: `Denunciar a ${otherName}` });
    list.push(
      blockedByMe
        ? { id: 'unblock', label: 'Desbloquear usuario' }
        : { id: 'block', label: 'Bloquear usuario' },
    );
    return list;
  }, [canReport, otherName, blockedByMe]);

  return (
    <OptionSheet
      visible={visible}
      title="Opciones del chat"
      options={options}
      onSelect={(id) => onSelect(id as ChatAction)}
      onCancel={onClose}
    />
  );
}

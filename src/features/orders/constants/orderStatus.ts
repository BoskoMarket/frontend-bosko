import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';
import type { TOKENS } from '@/core/design-system';
import type { OrderStatus } from '../types/orders.types';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Key of `TOKENS.status` (and `Badge` tone) used to color an order status. */
export type OrderStatusTone = keyof typeof TOKENS.status;

export interface OrderStatusInfo {
  label: string;
  desc: string;
  icon: MaterialIconName;
  tone: OrderStatusTone;
}

/** Single source of truth for how an order status is labelled and colored across the orders screens. */
export const ORDER_STATUS: Record<OrderStatus, OrderStatusInfo> = {
  pending:     { label: 'Pendiente',   desc: 'Esperando respuesta del proveedor', icon: 'hourglass-empty', tone: 'pending' },
  accepted:    { label: 'Aceptada',    desc: 'El proveedor confirmó el servicio', icon: 'check-circle',    tone: 'accepted' },
  in_progress: { label: 'En progreso', desc: 'El proveedor está trabajando',      icon: 'build',           tone: 'progress' },
  completed:   { label: 'Completada',  desc: 'Trabajo terminado exitosamente',    icon: 'verified',        tone: 'done' },
  cancelled:   { label: 'Cancelada',   desc: 'La orden fue cancelada',            icon: 'cancel',          tone: 'cancelled' },
  disputed:    { label: 'En disputa',  desc: 'Equipo Bosko está revisando',       icon: 'gavel',           tone: 'pending' },
};

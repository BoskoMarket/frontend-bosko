import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ReasonDialog,
  ScreenHeader,
  SkeletonList,
  SPACING,
  Text,
  toast,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { extractApiError } from '@/lib/errors';
import { useAdminReports, useReviewReport } from '@/hooks/queries/useAdminReportsQuery';
import {
  ADMIN_REPORT_NOTES_MAX_LENGTH,
  type AdminReport,
  type AdminReportDecision,
} from '@/features/admin/services/reports.service';
import {
  contextLabel,
  formatReportDate,
  personName,
  reasonLabel,
  REPORT_FILTERS,
  STATUS_BADGE,
  targetLabel,
} from '@/features/admin/utils/reportPresentation';

interface PendingDecision {
  report: AdminReport;
  status: AdminReportDecision;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  const tc = useThemeColors();
  return (
    <View style={s.fieldRow}>
      <Text variant="caption" color={tc.textSub}>{label}</Text>
      <Text variant="bodySmall" style={s.fieldValue}>{value}</Text>
    </View>
  );
}

function ReportCard({ report, onDecide }: { report: AdminReport; onDecide: (r: AdminReport, d: AdminReportDecision) => void }) {
  const tc = useThemeColors();
  const badge = STATUS_BADGE[report.status ?? 'pending'] ?? STATUS_BADGE.pending;
  const reporter = personName(report.reporter);
  const owner = personName(report.owner);
  const context = contextLabel(report);
  const date = formatReportDate(report.createdAt);
  const isPending = (report.status ?? 'pending') === 'pending';

  return (
    <Card padding="lg" radius="lg" contentStyle={s.cardContent}>
      <View style={s.cardHeader}>
        <View style={s.cardTitle}>
          <Text variant="subtitle">{reasonLabel(report.reason)}</Text>
          <Text variant="caption" color={tc.textSub}>
            {targetLabel(report.targetType)}{date ? ` · ${date}` : ''}
          </Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} size="sm" />
      </View>

      {report.details ? <Text variant="body">{report.details}</Text> : null}
      {reporter ? <FieldRow label="Denunciante" value={reporter} /> : null}
      {owner ? <FieldRow label="Dueño del contenido" value={owner} /> : null}
      {context ? <FieldRow label="Contexto" value={context} /> : null}
      {report.notes ? <FieldRow label="Notas" value={report.notes} /> : null}

      {isPending ? (
        <View style={s.actions}>
          <Button
            label="Descartar"
            variant="outline"
            size="sm"
            style={s.action}
            onPress={() => onDecide(report, 'dismissed')}
            icon={<Ionicons name="close-circle-outline" size={16} color={tc.text} />}
          />
          <Button
            label="Revisar"
            size="sm"
            style={s.action}
            onPress={() => onDecide(report, 'reviewed')}
            icon={<Ionicons name="checkmark-circle-outline" size={16} color={TOKENS.color.onPrimary} />}
          />
        </View>
      ) : null}
    </Card>
  );
}

export default function AdminReportsScreen() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const [filterKey, setFilterKey] = useState('pending');
  const [decision, setDecision] = useState<PendingDecision | null>(null);

  const filter = REPORT_FILTERS.find((f) => f.key === filterKey) ?? REPORT_FILTERS[0];
  const query = useAdminReports(filter.status);
  const review = useReviewReport();
  const reports = query.data ?? [];
  const forbidden = query.isError && extractApiError(query.error).statusCode === 403;

  const confirm = useCallback((notes: string) => {
    if (!decision) return;
    review.mutate(
      { id: decision.report.id, status: decision.status, notes },
      {
        onSuccess: () => {
          setDecision(null);
          toast.success(decision.status === 'reviewed' ? 'Denuncia revisada' : 'Denuncia descartada');
        },
        onError: (err) => {
          const { statusCode } = extractApiError(err);
          toast.error(
            'No se pudo actualizar la denuncia',
            statusCode === 403 ? 'Acceso solo para administradores.' : 'Intentá de nuevo en unos segundos.',
          );
        },
      },
    );
  }, [decision, review]);

  const renderBody = () => {
    if (forbidden) {
      return (
        <EmptyState
          icon="lock-closed-outline"
          title="Acceso solo para administradores"
          subtitle="Tu cuenta no tiene permiso para moderar denuncias."
        />
      );
    }
    if (query.isLoading) return <SkeletonList variant="card" count={4} style={s.skeleton} />;
    if (query.isError) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar las denuncias"
          subtitle="Revisá tu conexión e intentá de nuevo."
          cta={{ label: 'Reintentar', onPress: () => { query.refetch(); } }}
        />
      );
    }
    return (
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <ReportCard report={item} onDecide={(report, status) => setDecision({ report, status })} />
        )}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + SPACING.xxl }]}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="No hay denuncias"
            subtitle="Cuando haya denuncias con este filtro, van a aparecer acá."
          />
        }
        onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => { query.refetch(); }}
            tintColor={TOKENS.color.signal}
          />
        }
        ListFooterComponent={
          query.hasNextPage ? (
            <Button
              label="Cargar más"
              variant="ghost"
              loading={query.isFetchingNextPage}
              onPress={() => { query.fetchNextPage(); }}
            />
          ) : null
        }
      />
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <ScreenHeader title="Moderación" />
      {forbidden ? null : (
        <View style={s.filters}>
          {REPORT_FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={f.key === filterKey} onPress={() => setFilterKey(f.key)} />
          ))}
        </View>
      )}
      {renderBody()}
      <ReasonDialog
        visible={decision !== null}
        title={decision?.status === 'reviewed' ? 'Marcar como revisada' : 'Descartar denuncia'}
        message="Podés agregar una nota para el registro (opcional). Esto no sanciona ni elimina contenido."
        label="Notas"
        placeholder="Notas internas"
        confirmLabel={decision?.status === 'reviewed' ? 'Revisar' : 'Descartar'}
        destructive={false}
        optional
        showCounter
        maxLength={ADMIN_REPORT_NOTES_MAX_LENGTH}
        submitting={review.isPending}
        onCancel={() => setDecision(null)}
        onConfirm={confirm}
      />
    </View>
  );
}

function Separator() {
  return <View style={s.separator} />;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  list: { paddingHorizontal: SPACING.lg, flexGrow: 1 },
  skeleton: { paddingHorizontal: SPACING.lg },
  separator: { height: SPACING.md },
  cardContent: { gap: SPACING.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  cardTitle: { flex: 1, gap: SPACING.xs },
  fieldRow: { flexDirection: 'row', gap: SPACING.sm },
  fieldValue: { flex: 1 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  action: { flex: 1 },
});

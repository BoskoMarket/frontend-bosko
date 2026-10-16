import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from './state/ProfileContext';
import { useProviderStatus } from '@/hooks/useProviderStatus';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';
import { getUserStats, UserStats } from '@/features/profile/services/profile';
import {
  TOKENS,
  GRADIENTS,
  BRAND_RADIAL_FILL,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ListRow,
  Skeleton,
  Text,
  useIsDark,
  useThemeColors,
  withAlpha,
} from '@/core/design-system';
import type { BadgeTone } from '@/core/design-system';
import { ReelsAutoplayRow } from './components/ReelsAutoplayRow';
import { ThemeToggle } from '@/components/ThemeToggle';
import { openNotifications } from '@/stores/notificationsUI.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { toneColors } from '@/features/kyc/constants/kycStatus';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const AVATAR_SIZE = 96;
const AVATAR_RING = 4;

// ── KYC badge config ─────────────────────────────────────────────────────────
const KYC_CONFIG: Record<KYCStatus, { label: string; tone: BadgeTone; icon: IoniconName }> = {
  pending:      { label: 'KYC Pendiente', tone: 'pending',   icon: 'time-outline' },
  in_progress:  { label: 'KYC Pendiente', tone: 'pending',   icon: 'time-outline' },
  not_started:  { label: 'Sin verificar', tone: 'pending',   icon: 'time-outline' },
  approved:     { label: 'Verificado',    tone: 'done',      icon: 'checkmark-circle' },
  rejected:     { label: 'KYC Rechazado', tone: 'cancelled', icon: 'close-circle' },
  declined:     { label: 'KYC Rechazado', tone: 'cancelled', icon: 'close-circle' },
  failed:       { label: 'KYC Fallido',   tone: 'cancelled', icon: 'close-circle' },
  expired:      { label: 'KYC Vencido',   tone: 'pending',   icon: 'time-outline' },
};

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const steps    = 28;
    const increment = target / steps;
    const interval  = duration / steps;
    let current     = 0;
    const t = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(t); }
      else { setCount(Math.floor(current)); }
    }, interval);
    return () => clearInterval(t);
  }, [target]);
  return count;
}

// ── Stat cell ────────────────────────────────────────────────────────────────
function StatCell({
  value, label, suffix, color,
}: {
  value: number; label: string; suffix?: string; color?: string;
}) {
  const tc = useThemeColors();
  const displayed = useCountUp(value);
  return (
    <View style={ss.statCell}>
      <Text variant="h3" weight="800" color={color ?? tc.text}>
        {suffix === 'fixed' ? displayed.toFixed(1) : displayed}
        {suffix && suffix !== 'fixed' ? suffix : ''}
      </Text>
      <Text variant="caption" color={tc.textSub}>{label}</Text>
    </View>
  );
}

// ── Stats skeleton ────────────────────────────────────────────────────────────
function StatsSkeleton({ cells }: { cells: number }) {
  const tc = useThemeColors();
  return (
    <>
      {Array.from({ length: cells }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={[ss.statDivider, { backgroundColor: tc.border }]} />}
          <View style={ss.statCell}>
            <Skeleton width={44} height={22} radius={6} />
            <Skeleton width={36} height={11} radius={4} />
          </View>
        </React.Fragment>
      ))}
    </>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickCard({
  icon, label, color, iconColor, onPress, delay,
}: {
  icon: IoniconName;
  label: string;
  color: string;
  iconColor: string;
  onPress: () => void;
  delay: number;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 7 }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
        flex: 1,
      }}
    >
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={ss.quickCard}
      >
        <Animated.View style={[ss.quickIconWrap, { backgroundColor: color, transform: [{ scale }] }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Animated.View>
        <Text variant="caption" weight="600">{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Settings row: ListRow + optional badge (+ chevron when pressable) ────────
function SettingsRow({
  icon, label, badge, badgeTone, onPress, danger, accessory,
}: {
  icon: IoniconName;
  label: string;
  badge?: string;
  badgeTone?: BadgeTone;
  onPress?: () => void;
  danger?: boolean;
  accessory?: React.ReactNode;
}) {
  const tc = useThemeColors();
  const right = accessory ?? (badge ? (
    <View style={ss.badgeRight}>
      <Badge label={badge} tone={badgeTone ?? 'brand'} size="sm" />
      {onPress ? <Ionicons name="chevron-forward" size={16} color={tc.textMuted} /> : null}
    </View>
  ) : undefined);
  return <ListRow icon={icon} label={label} danger={danger} onPress={onPress} right={right} />;
}

// ── Settings group ────────────────────────────────────────────────────────────
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const tc = useThemeColors();
  return (
    <View style={ss.group}>
      <Text variant="caption" weight="700" color={tc.textSub} style={ss.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <Card padding="xs" radius="lg">{children}</Card>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { logout } = useAuth();
  const { profile, isLoading, error: profileError, refreshProfile } = useProfile();
  const { status: roleStatus, kycStatus, isLoading: roleLoading } = useProviderStatus();
  const { count: favCount } = useFavorites();

  const [stats, setStats]               = useState<UserStats | null>(null);
  const [statsFailed, setStatsFailed]   = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // Entrance animations for 5 sections
  const sections = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(avatarAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.stagger(80, sections.map(v =>
        Animated.timing(v, { toValue: 1, duration: 400, useNativeDriver: true })
      )),
    ]).start();
  }, []);

  const sec = (i: number) => ({
    opacity: sections[i],
    transform: [{ translateY: sections[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  const loadStats = useCallback(async () => {
    setStatsFailed(false);
    try {
      setStats(await getUserStats());
    } catch {
      setStatsFailed(true);
    }
  }, []);

  // Load stats
  useEffect(() => {
    if (profile) loadStats();
  }, [profile?.id, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile().catch(() => {});
    await loadStats();
    setRefreshing(false);
  }, [refreshProfile, loadStats]);

  const openEditProfile = useCallback(() => router.push('/(tabs)/profile/EditProfile'), []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // Derived
  const isProvider = roleStatus === 'provider';
  const isPending  = roleStatus === 'pending';
  const kycCfg     = KYC_CONFIG[kycStatus];
  const kycColors  = kycCfg ? toneColors(kycCfg.tone, tc) : null;
  const fullName   = profile
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : '';

  const statusBar = <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />;

  // Tapa el contenido role-gated hasta saber si es cliente/pending/provider —
  // evita el flash de CTA "ser proveedor" / quick actions de cliente en cold start.
  if (roleLoading) {
    return (
      <View style={[ss.root, ss.loaderRoot, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        {statusBar}
        <ActivityIndicator size="large" color={TOKENS.color.signal} />
      </View>
    );
  }

  // Profile failed to load (and nothing cached): offer a retry instead of an empty screen.
  if (!profile && !isLoading) {
    return (
      <View style={[ss.root, ss.loaderRoot, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        {statusBar}
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tu perfil"
          subtitle={profileError ?? 'Revisá tu conexión e intentá de nuevo.'}
          cta={{ label: 'Reintentar', onPress: () => { refreshProfile(); } }}
        />
      </View>
    );
  }

  return (
    <View style={[ss.root, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      {statusBar}
      <AnimatedBackground variant="app" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.color.signal} />
        }
      >

        {/* ── Hero banner + avatar ──────────────────────────────────────── */}
        <View style={ss.hero}>
          {profile?.bannerUrl ? (
            <Image source={{ uri: profile.bannerUrl }} style={ss.banner} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={GRADIENTS.brandDeep}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.banner}
            />
          )}
          <View style={[ss.heroBubble, { width: 180, height: 180, top: -50, right: -30, opacity: 0.10 }]} />
          <View style={[ss.heroBubble, { width: 100, height: 100, top: 20, right: 100, opacity: 0.06 }]} />

          <View style={ss.avatarWrap}>
            <Animated.View
              style={[
                ss.avatarRing,
                TOKENS.shadow.soft,
                {
                  borderColor: tc.bg,
                  backgroundColor: tc.bg,
                  transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  opacity: avatarAnim,
                },
              ]}
            >
              <Pressable
                onPress={openEditProfile}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto de perfil"
              >
                <Avatar uri={profile?.avatarUrl} name={profile?.firstName} size={AVATAR_SIZE} />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* ── Profile info ─────────────────────────────────────────────── */}
        <Animated.View style={[ss.infoBlock, sec(0)]}>
          <View style={ss.nameRow}>
            <Text variant="h3" weight="800" style={ss.nameText}>{fullName}</Text>
            {profile?.isVerified && profile?.backgroundCheckStatus === 'APPROVED' && (
              <Badge label="Verificado" tone="accepted" icon="checkmark-circle" size="sm" />
            )}
          </View>

          {profile?.email ? <Text variant="body" color={tc.textSub}>{profile.email}</Text> : null}

          <View style={ss.metaRow}>
            {profile?.location ? (
              <View style={ss.metaItem}>
                <Ionicons name="location-outline" size={13} color={tc.textSub} />
                <Text variant="caption" color={tc.textSub}>{profile.location}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View style={ss.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={tc.textSub} />
                <Text variant="caption" color={tc.textSub}>Desde {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* KYC badge: providers (con toggle de disponibilidad) y pending (solo estado) */}
          {(isProvider || isPending) && kycCfg && kycStatus !== 'approved' ? (
            <View style={ss.badgeRow}>
              <Pressable
                onPress={() => router.push(isPending ? '/(tabs)/profile/become-provider' : '/(tabs)/profile/kyc')}
                accessibilityRole="button"
                accessibilityLabel={`${kycCfg.label}. Ver estado de verificación`}
              >
                <Badge label={kycCfg.label} tone={kycCfg.tone} icon={kycCfg.icon} />
              </Pressable>
            </View>
          ) : null}

          {profile?.bio ? (
            <Text variant="body" color={tc.textSub} style={ss.bioText}>{profile.bio}</Text>
          ) : null}

          <Button
            label="Editar perfil"
            variant="outline"
            size="sm"
            style={ss.editBtn}
            icon={<Ionicons name="pencil-outline" size={15} color={TOKENS.color.signal} />}
            onPress={openEditProfile}
          />
        </Animated.View>

        {/* ── Stats (distintas según rol) ───────────────────────────────── */}
        <Animated.View style={[ss.statsWrap, sec(1)]}>
          <Card padding="lg" radius="lg" contentStyle={ss.statsCard}>
            {statsFailed && stats === null ? (
              <Pressable
                style={ss.statsError}
                onPress={loadStats}
                accessibilityRole="button"
                accessibilityLabel="No se pudieron cargar tus estadísticas. Reintentar"
              >
                <Ionicons name="refresh-outline" size={16} color={TOKENS.color.signal} />
                <Text variant="bodySmall" color={tc.textSub}>No se pudieron cargar tus estadísticas. Tocá para reintentar.</Text>
              </Pressable>
            ) : stats === null ? (
              <StatsSkeleton cells={isProvider ? 4 : 2} />
            ) : isProvider ? (
              <>
                <StatCell value={stats.servicesCount ?? 0}   label="Servicios" />
                <View style={[ss.statDivider, { backgroundColor: tc.border }]} />
                <StatCell value={stats.averageRating ?? 0}   label="Valoración" suffix="fixed" color={TOKENS.color.rating} />
                <View style={[ss.statDivider, { backgroundColor: tc.border }]} />
                <StatCell value={stats.reviewsCount ?? 0}    label="Reseñas" />
                <View style={[ss.statDivider, { backgroundColor: tc.border }]} />
                <StatCell value={stats.completedOrders ?? 0} label="Completados" color={TOKENS.status.done.fg} />
              </>
            ) : (
              <>
                <StatCell value={stats.completedOrders ?? 0} label="Pedidos" color={TOKENS.status.done.fg} />
                <View style={[ss.statDivider, { backgroundColor: tc.border }]} />
                <Pressable
                  style={ss.statCell}
                  onPress={() => router.push('/(tabs)/profile/favorites')}
                  accessibilityRole="button"
                  accessibilityLabel={`Favoritos: ${favCount}`}
                >
                  <StatCell value={favCount} label="Favoritos" color={TOKENS.color.signal} />
                </Pressable>
              </>
            )}
          </Card>
        </Animated.View>

        {/* ── Quick access (distintas según rol) ────────────────────────── */}
        <Animated.View style={[ss.section, sec(2)]}>
          <Text variant="title" style={ss.sectionTitle} accessibilityRole="header">Acceso rápido</Text>
          <View style={ss.quickRow}>
            {isProvider ? (
              <>
                <QuickCard
                  icon="construct-outline"
                  label="Servicios"
                  color={tc.accent}
                  iconColor={TOKENS.color.signal}
                  onPress={() => router.push('/(tabs)/profile/Services')}
                  delay={0}
                />
                <QuickCard
                  icon="receipt-outline"
                  label="Órdenes"
                  color={TOKENS.status.accepted.bg}
                  iconColor={TOKENS.status.accepted.fg}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={60}
                />
                <QuickCard
                  icon="star-outline"
                  label="Reseñas"
                  color={TOKENS.status.pending.bg}
                  iconColor={TOKENS.status.pending.fg}
                  onPress={() => router.push('/(tabs)/profile/my-reviews')}
                  delay={120}
                />
                <QuickCard
                  icon="film-outline"
                  label="Mis reels"
                  color={tc.accent}
                  iconColor={TOKENS.color.signal}
                  onPress={() => router.push('/(tabs)/profile/my-reels')}
                  delay={180}
                />
              </>
            ) : (
              <>
                <QuickCard
                  icon="receipt-outline"
                  label="Mis pedidos"
                  color={TOKENS.status.accepted.bg}
                  iconColor={TOKENS.status.accepted.fg}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={0}
                />
                <QuickCard
                  icon="chatbubbles-outline"
                  label="Mensajes"
                  color={TOKENS.status.pending.bg}
                  iconColor={TOKENS.status.pending.fg}
                  onPress={() => router.push('/(tabs)/chat')}
                  delay={60}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* ── CTA "Quiero ser proveedor" (solo cliente sin KYC arrancado) ── */}
        {roleStatus === 'client' && (
          <Animated.View style={[ss.section, sec(2)]}>
            <View style={[ss.providerCtaShadow, TOKENS.shadow.card]}>
              <Pressable
                onPress={() => router.push('/(tabs)/profile/become-provider')}
                accessibilityRole="button"
                accessibilityLabel="¿Querés ofrecer servicios? Verificá tu identidad y empezá a publicar"
                style={ss.providerCta}
              >
                <View style={[ss.providerCtaGrad, BRAND_RADIAL_FILL]}>
                  <View style={[ss.providerCtaIcon, { backgroundColor: TOKENS.onMedia.fill }]}>
                    <Ionicons name="briefcase-outline" size={22} color={TOKENS.color.onPrimary} />
                  </View>
                  <View style={ss.providerCtaText}>
                    <Text variant="subtitle" color={TOKENS.color.onPrimary}>¿Querés ofrecer servicios?</Text>
                    <Text variant="caption" color={TOKENS.onMedia.textSub}>Verificá tu identidad y empezá a publicar</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={TOKENS.onMedia.textSub} />
                </View>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── Estado "en camino a ser proveedor" (KYC arrancado, sin aprobar) ── */}
        {isPending && kycCfg && kycColors && (
          <Animated.View style={[ss.section, sec(2)]}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/become-provider')}
              accessibilityRole="button"
              style={[ss.pendingCard, { backgroundColor: kycColors.bg, borderColor: withAlpha(kycColors.fg, 0.19) }]}
            >
              <View style={[ss.pendingIcon, { backgroundColor: withAlpha(kycColors.fg, 0.12) }]}>
                <Ionicons name={kycCfg.icon} size={22} color={kycColors.fg} />
              </View>
              <View style={ss.providerCtaText}>
                <Text variant="subtitle" color={kycColors.fg}>Estás camino a ser prestador</Text>
                <Text variant="caption" color={tc.textSub}>
                  {kycStatus === 'rejected' || kycStatus === 'declined' || kycStatus === 'failed'
                    ? 'Hubo un problema con tu verificación — tocá para reintentar.'
                    : kycStatus === 'expired'
                      ? 'Tu verificación venció — tocá para reintentar.'
                      : 'Estamos revisando tu verificación. Tocá para ver el progreso.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={kycColors.fg} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Settings: Mi cuenta ──────────────────────────────────────── */}
        <Animated.View style={sec(3)}>
          <SettingsGroup title="Mi cuenta">
            <SettingsRow
              icon="person-outline"
              label="Editar Perfil"
              onPress={openEditProfile}
            />
            <Divider />
            {isPending && (
              <>
                <SettingsRow
                  icon="shield-checkmark-outline"
                  label="Estado de verificación"
                  badge={kycCfg?.label}
                  badgeTone={kycCfg?.tone}
                  onPress={() => router.push('/(tabs)/profile/become-provider')}
                />
                <Divider />
              </>
            )}
            {isProvider && (
              <>
                <SettingsRow
                  icon="shield-checkmark-outline"
                  label="Verificación de Identidad"
                  badge={kycCfg?.label}
                  badgeTone={kycCfg?.tone}
                  onPress={() => router.push('/(tabs)/profile/kyc')}
                />
                <Divider />
                <SettingsRow
                  icon="document-text-outline"
                  label="Antecedentes penales"
                  onPress={() => router.push('/(tabs)/profile/background-check')}
                />
                <Divider />
                <SettingsRow
                  icon="diamond-outline"
                  label="Planes Premium"
                  badge="Ver planes"
                  badgeTone="pending"
                  onPress={() => router.push('/(tabs)/profile/plans')}
                />
                <Divider />
              </>
            )}
            <SettingsRow
              icon="card-outline"
              label="Métodos de Pago"
              badge="Próximamente"
              badgeTone="neutral"
            />
          </SettingsGroup>
        </Animated.View>

        {/* ── Settings: Preferencias ───────────────────────────────────── */}
        <Animated.View style={sec(4)}>
          <SettingsGroup title="Preferencias">
            <SettingsRow
              icon="notifications-outline"
              label="Notificaciones"
              onPress={openNotifications}
            />
            <Divider />
            <SettingsRow
              icon="lock-closed-outline"
              label="Cambiar Contraseña"
              onPress={() => router.push('/(tabs)/profile/ChangePassword')}
            />
            <Divider />
            <SettingsRow
              icon={isDark ? 'moon-outline' : 'sunny-outline'}
              label={isDark ? 'Modo Oscuro' : 'Modo Claro'}
              accessory={<ThemeToggle />}
            />
            <Divider />
            <ReelsAutoplayRow />
          </SettingsGroup>

          <View style={ss.dangerGroup}>
            <Button
              label="Cerrar Sesión"
              variant="dangerOutline"
              fullWidth
              icon={<Ionicons name="log-out-outline" size={18} color={TOKENS.color.error} />}
              onPress={handleLogout}
            />
            <Pressable
              onPress={() => router.push('/(tabs)/profile/delete-account')}
              accessibilityRole="button"
              accessibilityLabel="Eliminar cuenta"
              style={ss.deleteBtn}
            >
              <Text variant="bodySmall" color={tc.textSub} style={ss.deleteText}>Eliminar cuenta</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>

    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
// Layout only — every color comes from tokens / useThemeColors() at render time.
const ss = StyleSheet.create({
  root: { flex: 1 },
  loaderRoot: { alignItems: 'center', justifyContent: 'center' },

  // Hero / banner
  hero: { height: 170, overflow: 'visible' },
  banner: { width: '100%', height: 170 },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: TOKENS.onMedia.solid,
  },
  avatarWrap: { position: 'absolute', bottom: -52, left: 20 },
  avatarRing: {
    width: AVATAR_SIZE + AVATAR_RING * 2,
    height: AVATAR_SIZE + AVATAR_RING * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_RING * 2) / 2,
    borderWidth: AVATAR_RING,
    overflow: 'hidden',
  },

  // Profile info
  infoBlock: { marginTop: 62, paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nameText: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 },
  bioText: { marginTop: 4 },
  editBtn: { alignSelf: 'flex-start', marginTop: 8 },

  // Stats
  statsWrap: { marginHorizontal: 16, marginTop: 20 },
  statsCard: { flexDirection: 'row', alignItems: 'center' },
  statsError: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statCell: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 36, marginVertical: 6 },

  // Quick access
  section: { marginHorizontal: 16, marginTop: 22 },
  sectionTitle: { marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: { alignItems: 'center', gap: 7 },
  quickIconWrap: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Settings
  group: { gap: 8, marginHorizontal: 16, marginTop: 22 },
  groupTitle: { letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4 },
  badgeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Danger zone
  dangerGroup: { marginHorizontal: 16, marginTop: 22, gap: 8 },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { textDecorationLine: 'underline' },

  // CTA "Quiero ser proveedor"
  providerCtaShadow: { borderRadius: 18 },
  providerCta: { borderRadius: 18, overflow: 'hidden' },
  providerCtaGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  providerCtaIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  providerCtaText: { flex: 1, gap: 3 },

  // Estado "pending" (KYC arrancado, sin aprobar)
  pendingCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 1.5 },
  pendingIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

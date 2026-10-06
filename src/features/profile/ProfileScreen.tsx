import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import { getUserStats, UpdateProfilePayload, UserStats } from '@/features/profile/services/profile';
import { EditProfileModal } from './components/EditProfileModal';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/core/components/Toast';
import { openNotifications } from '@/stores/notificationsUI.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width: W } = Dimensions.get('window');

// Colores semánticos fijos (no cambian con el tema)
const SEMANTIC = {
  primary: TOKENS.color.primary,
  dark:    TOKENS.color.primaryDark,
  blue:    '#3B82F6',
  green:   '#22C55E',
  amber:   '#F59E0B',
  red:     '#EF4444',
};

type CPalette = ReturnType<typeof makeC>;
function makeC(tc: ReturnType<typeof useThemeColors>) {
  return {
    ...SEMANTIC,
    bg:      tc.bg,
    card:    tc.card,
    surface: tc.surface,
    text:    tc.text,
    sub:    tc.textSub,
    border: tc.border,
    accent: tc.accent,
  };
}

// ── KYC badge config ─────────────────────────────────────────────────────────
const KYC_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  pending:      { label: 'KYC Pendiente',  color: SEMANTIC.amber, bg: '#FFF8E1', icon: 'time-outline' },
  in_progress:  { label: 'KYC Pendiente',  color: SEMANTIC.amber, bg: '#FFF8E1', icon: 'time-outline' },
  not_started:  { label: 'Sin verificar',  color: SEMANTIC.amber, bg: '#FFF8E1', icon: 'time-outline' },
  approved:     { label: 'Verificado',     color: SEMANTIC.green, bg: '#F0FFF4', icon: 'checkmark-circle' },
  rejected:     { label: 'KYC Rechazado',  color: SEMANTIC.red,   bg: '#FEF2F2', icon: 'close-circle' },
  declined:     { label: 'KYC Rechazado',  color: SEMANTIC.red,   bg: '#FEF2F2', icon: 'close-circle' },
  failed:       { label: 'KYC Fallido',    color: SEMANTIC.red,   bg: '#FEF2F2', icon: 'close-circle' },
  expired:      { label: 'KYC Vencido',    color: SEMANTIC.amber, bg: '#FFF8E1', icon: 'time-outline' },
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
      <Text style={[ss.statValue, { color: color ?? tc.text }]}>
        {suffix === 'fixed' ? displayed.toFixed(1) : displayed}
        {suffix && suffix !== 'fixed' ? suffix : ''}
      </Text>
      <Text style={[ss.statLabel, { color: tc.textSub }]}>{label}</Text>
    </View>
  );
}

// ── Stats shimmer skeleton ────────────────────────────────────────────────────
function StatsShimmer({ cells }: { cells: number }) {
  const tc = useThemeColors();
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const shimBg = tc.border;
  return (
    <>
      {Array.from({ length: cells }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={[ss.statDivider, { backgroundColor: tc.border }]} />}
          <Animated.View style={[ss.statCell, { opacity }]}>
            <View style={[ss.shimmerValue, { backgroundColor: shimBg }]} />
            <View style={[ss.shimmerLabel, { backgroundColor: shimBg }]} />
          </Animated.View>
        </React.Fragment>
      ))}
    </>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickCard({
  icon, label, color, iconColor, onPress, delay,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
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
        style={ss.quickCard}
      >
        <Animated.View style={[ss.quickIconWrap, { backgroundColor: color, transform: [{ scale }] }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Animated.View>
        <QuickLabel label={label} />
      </Pressable>
    </Animated.View>
  );
}

function QuickLabel({ label }: { label: string }) {
  const tc = useThemeColors();
  return <Text style={[ss.quickLabel, { color: tc.text }]}>{label}</Text>;
}

// ── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon, iconBg, iconColor, label, badge, badgeColor, badgeBg, onPress, danger, accessory,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  onPress?: () => void;
  danger?: boolean;
  accessory?: React.ReactNode;
}) {
  const tc = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const inner = (
    <Animated.View style={[ss.settingsInner, { transform: [{ scale }] }]}>
      <View style={[ss.settingsIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[ss.settingsLabel, { color: danger ? SEMANTIC.red : tc.text }]}>{label}</Text>
      <View style={ss.settingsRight}>
        {badge ? (
          <View style={[ss.badge, { backgroundColor: badgeBg ?? tc.accent }]}>
            <Text style={[ss.badgeText, { color: badgeColor ?? SEMANTIC.primary }]}>{badge}</Text>
          </View>
        ) : null}
        {accessory ? accessory : !danger ? (
          <Ionicons name="chevron-forward" size={16} color={tc.border} />
        ) : null}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,   useNativeDriver: true }).start()}
        onPress={onPress}
        style={ss.settingsRow}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={ss.settingsRow}>{inner}</View>;
}

// ── Settings group ────────────────────────────────────────────────────────────
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const tc = useThemeColors();
  return (
    <View style={ss.group}>
      <Text style={[ss.groupTitle, { color: tc.textSub }]}>{title}</Text>
      <View style={[ss.groupCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>{children}</View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const isDark = useIsDark();
  const C = useMemo(() => makeC(themeColors), [themeColors]);
  const s = useMemo(() => makeStyles(C), [C]);
  const { authState, logout } = useAuth();
  const { profile, isLoading, refreshProfile, updateProfile } = useProfile();
  const { status: roleStatus, kycStatus, isLoading: roleLoading } = useProviderStatus();
  const { count: favCount } = useFavorites();

  const [stats, setStats]               = useState<UserStats | null>(null);
  const [editVisible, setEditVisible]   = useState(false);
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

  // Load stats
  useEffect(() => {
    if (profile) getUserStats().then(setStats).catch(() => {});
  }, [profile?.id]);

  useEffect(() => {
    if (!roleLoading) {
      console.log('[ProfileScreen] role:', { roleStatus, kycStatus, isProvider: profile?.isProvider });
    }
  }, [roleLoading, roleStatus, kycStatus, profile?.isProvider]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile().catch(() => {});
    await getUserStats().then(setStats).catch(() => {});
    setRefreshing(false);
  }, [refreshProfile]);

  const handleSave = async (data: UpdateProfilePayload) => {
    try {
      await updateProfile(data);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error('No se pudo guardar', 'Intenta de nuevo');
      throw err;
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Derived
  const isProvider = roleStatus === 'provider';
  const isPending  = roleStatus === 'pending';
  const kycCfg     = KYC_CONFIG[kycStatus];
  const fullName   = profile
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : '';

  // Tapa el contenido role-gated hasta saber si es cliente/pending/provider —
  // evita el flash de CTA "ser proveedor" / quick actions de cliente en cold start.
  if (roleLoading) {
    return (
      <View style={[s.root, s.loaderRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <AnimatedBackground variant="app" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >

        {/* ── Hero banner + avatar ──────────────────────────────────────── */}
        <View style={s.hero}>
          {profile?.bannerUrl ? (
            <Image source={{ uri: profile.bannerUrl }} style={s.banner} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[C.dark, C.primary, '#c0002f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.banner}
            />
          )}
          <View style={[s.heroBubble, { width: 180, height: 180, top: -50, right: -30, opacity: 0.10 }]} />
          <View style={[s.heroBubble, { width: 100, height: 100, top: 20, right: 100, opacity: 0.06 }]} />

          <View style={s.avatarWrap}>
            <View style={s.avatarShadow}>
              <Animated.View
                style={[
                  s.avatarRing,
                  {
                    transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                    opacity: avatarAnim,
                  },
                ]}
              >
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[C.primary, C.dark]} style={s.avatarFallback}>
                  <Text style={s.avatarInitial}>
                    {(profile?.firstName?.[0] ?? 'U').toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>
          </View>
        </View>
        </View>

        {/* ── Profile info ─────────────────────────────────────────────── */}
        <Animated.View style={[s.infoBlock, sec(0)]}>
          <View style={s.nameRow}>
            <Text style={s.nameText}>{fullName}</Text>
            {profile?.isVerified && profile?.backgroundCheckStatus === 'APPROVED' && (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={C.blue} />
                <Text style={s.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>

          {profile?.email ? <Text style={s.usernameText}>{profile.email}</Text> : null}

          <View style={s.metaRow}>
            {profile?.location ? (
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={13} color={C.sub} />
                <Text style={s.metaText}>{profile.location}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View style={s.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={C.sub} />
                <Text style={s.metaText}>Desde {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* KYC badge: providers (con toggle de disponibilidad) y pending (solo estado) */}
          {(isProvider || isPending) && kycCfg && kycStatus !== 'approved' ? (
            <View style={s.badgeRow}>
              <Pressable
                onPress={() => router.push(isPending ? '/(tabs)/profile/become-provider' : '/(tabs)/profile/kyc')}
                style={[s.kycBadge, { backgroundColor: kycCfg.bg }]}
              >
                <Ionicons name={kycCfg.icon} size={14} color={kycCfg.color} />
                <Text style={[s.kycText, { color: kycCfg.color }]}>{kycCfg.label}</Text>
              </Pressable>
            </View>
          ) : null}

          {profile?.bio ? (
            <Text style={s.bioText}>{profile.bio}</Text>
          ) : null}

          <Pressable onPress={() => setEditVisible(true)} style={s.editBtn}>
            <Ionicons name="pencil-outline" size={15} color={C.primary} />
            <Text style={s.editBtnText}>Editar perfil</Text>
          </Pressable>
        </Animated.View>

        {/* ── Stats (distintas según rol) ───────────────────────────────── */}
        <Animated.View style={[s.statsCard, sec(1)]}>
          {stats === null ? (
            <StatsShimmer cells={isProvider ? 4 : 2} />
          ) : isProvider ? (
            <>
              <StatCell value={stats.servicesCount ?? 0}   label="Servicios" />
              <View style={s.statDivider} />
              <StatCell value={stats.averageRating ?? 0}   label="Valoración" suffix="fixed" color="#F59E0B" />
              <View style={s.statDivider} />
              <StatCell value={stats.reviewsCount ?? 0}    label="Reseñas" />
              <View style={s.statDivider} />
              <StatCell value={stats.completedOrders ?? 0} label="Completados" color={C.green} />
            </>
          ) : (
            <>
              <StatCell value={stats.completedOrders ?? 0} label="Pedidos" color={C.green} />
              <View style={s.statDivider} />
              <Pressable style={s.statCell} onPress={() => router.push('/(tabs)/profile/favorites')}>
                <StatCell value={favCount} label="Favoritos" color={C.primary} />
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* ── Quick access (distintas según rol) ────────────────────────── */}
        <Animated.View style={[s.section, sec(2)]}>
          <Text style={s.sectionTitle}>Acceso rápido</Text>
          <View style={s.quickRow}>
            {isProvider ? (
              <>
                <QuickCard
                  icon="construct-outline"
                  label="Servicios"
                  color={C.accent}
                  iconColor={C.primary}
                  onPress={() => router.push('/(tabs)/profile/Services')}
                  delay={0}
                />
                <QuickCard
                  icon="receipt-outline"
                  label="Órdenes"
                  color="#EBF4FF"
                  iconColor={C.blue}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={60}
                />
                <QuickCard
                  icon="star-outline"
                  label="Reseñas"
                  color="#FFFBEB"
                  iconColor={C.amber}
                  onPress={() => router.push('/(tabs)/profile/my-reviews')}
                  delay={120}
                />
                <QuickCard
                  icon="film-outline"
                  label="Mis reels"
                  color={C.accent}
                  iconColor={C.primary}
                  onPress={() => router.push('/(tabs)/profile/my-reels')}
                  delay={180}
                />
              </>
            ) : (
              <>
                <QuickCard
                  icon="receipt-outline"
                  label="Mis pedidos"
                  color="#EBF4FF"
                  iconColor={C.blue}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={0}
                />
                <QuickCard
                  icon="chatbubbles-outline"
                  label="Mensajes"
                  color="#FFF8E1"
                  iconColor={C.amber}
                  onPress={() => router.push('/(tabs)/chat')}
                  delay={60}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* ── CTA "Quiero ser proveedor" (solo cliente sin KYC arrancado) ── */}
        {roleStatus === 'client' && (
          <Animated.View style={[s.section, sec(2)]}>
            <View style={s.providerCtaShadow}>
              <Pressable
                onPress={() => router.push('/(tabs)/profile/become-provider')}
                style={s.providerCta}
              >
              <LinearGradient
                colors={[C.dark, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.providerCtaGrad}
              >
                <View style={s.providerCtaIcon}>
                  <Ionicons name="briefcase-outline" size={22} color="#fff" />
                </View>
                <View style={s.providerCtaText}>
                  <Text style={s.providerCtaTitle}>¿Querés ofrecer servicios?</Text>
                  <Text style={s.providerCtaSub}>Verificá tu identidad y empezá a publicar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </Pressable>
          </View>
          </Animated.View>
        )}

        {/* ── Estado "en camino a ser proveedor" (KYC arrancado, sin aprobar) ── */}
        {isPending && kycCfg && (
          <Animated.View style={[s.section, sec(2)]}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/become-provider')}
              style={[s.pendingCard, { backgroundColor: kycCfg.bg, borderColor: kycCfg.color + '30' }]}
            >
              <View style={[s.pendingIcon, { backgroundColor: kycCfg.color + '20' }]}>
                <Ionicons name={kycCfg.icon} size={22} color={kycCfg.color} />
              </View>
              <View style={s.providerCtaText}>
                <Text style={[s.pendingTitle, { color: kycCfg.color }]}>Estás camino a ser prestador</Text>
                <Text style={[s.pendingSub, { color: C.sub }]}>
                  {kycStatus === 'rejected' || kycStatus === 'declined' || kycStatus === 'failed'
                    ? 'Hubo un problema con tu verificación — tocá para reintentar.'
                    : kycStatus === 'expired'
                      ? 'Tu verificación venció — tocá para reintentar.'
                      : 'Estamos revisando tu verificación. Tocá para ver el progreso.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={kycCfg.color} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Settings: Mi cuenta ──────────────────────────────────────── */}
        <Animated.View style={sec(3)}>
          <SettingsGroup title="Mi cuenta">
            <SettingsRow
              icon="person-outline"
              iconBg="#EBF4FF"
              iconColor={C.blue}
              label="Editar Perfil"
              onPress={() => setEditVisible(true)}
            />
            <View style={s.rowSep} />
            {isPending && (
              <>
                <SettingsRow
                  icon="shield-checkmark-outline"
                  iconBg={kycCfg?.bg ?? '#FFF8E1'}
                  iconColor={kycCfg?.color ?? C.amber}
                  label="Estado de verificación"
                  badge={kycCfg?.label}
                  badgeColor={kycCfg?.color}
                  badgeBg={kycCfg?.bg}
                  onPress={() => router.push('/(tabs)/profile/become-provider')}
                />
                <View style={s.rowSep} />
              </>
            )}
            {isProvider && (
              <>
                <SettingsRow
                  icon="shield-checkmark-outline"
                  iconBg={kycCfg?.bg ?? '#F0FFF4'}
                  iconColor={kycCfg?.color ?? C.green}
                  label="Verificación de Identidad"
                  badge={kycCfg?.label}
                  badgeColor={kycCfg?.color}
                  badgeBg={kycCfg?.bg}
                  onPress={() => router.push('/(tabs)/profile/kyc')}
                />
                <View style={s.rowSep} />
                <SettingsRow
                  icon="document-text-outline"
                  iconBg="#EBF4FF"
                  iconColor={C.blue}
                  label="Antecedentes penales"
                  onPress={() => router.push('/(tabs)/profile/background-check')}
                />
                <View style={s.rowSep} />
                <SettingsRow
                  icon="diamond-outline"
                  iconBg="#FFF8E1"
                  iconColor={C.amber}
                  label="Planes Premium"
                  badge="Ver planes"
                  badgeColor={C.amber}
                  badgeBg="#FFF8E1"
                  onPress={() => router.push('/(tabs)/profile/plans')}
                />
              </>
            )}
          </SettingsGroup>
        </Animated.View>

        {/* ── Settings: Preferencias ───────────────────────────────────── */}
        <Animated.View style={sec(4)}>
          <SettingsGroup title="Preferencias">
            <SettingsRow
              icon="notifications-outline"
              iconBg="#F0F4FF"
              iconColor="#6366F1"
              label="Notificaciones"
              onPress={openNotifications}
            />
            <View style={s.rowSep} />
            <SettingsRow
              icon="lock-closed-outline"
              iconBg="#FFF0F3"
              iconColor={C.primary}
              label="Cambiar Contraseña"
              onPress={() => router.push('/(tabs)/profile/ChangePassword')}
            />
            <View style={s.rowSep} />
            <SettingsRow
              icon={isDark ? 'moon-outline' : 'sunny-outline'}
              iconBg={isDark ? 'rgba(192,132,252,0.12)' : 'rgba(245,158,11,0.12)'}
              iconColor={isDark ? '#C084FC' : '#F59E0B'}
              label={isDark ? 'Modo Oscuro' : 'Modo Claro'}
              accessory={<ThemeToggle />}
            />
          </SettingsGroup>

          <View style={s.dangerGroup}>
            <Pressable onPress={handleLogout} style={s.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color={C.red} />
              <Text style={s.logoutText}>Cerrar Sesión</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/delete-account')}
              style={s.deleteBtn}
            >
              <Text style={s.deleteText}>Eliminar cuenta</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={handleSave}
        initialData={{
          firstName: profile?.firstName ?? '',
          lastName:  profile?.lastName,
          bio:       profile?.bio,
          avatarUrl: profile?.avatarUrl,
        }}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
// ss = estilos estáticos sin colores (para sub-components module-level)
// makeStyles(C) = estilos con colores para el componente principal
const ss = StyleSheet.create({
  // layout-only — sub-components lean here
  statCell:    { flex: 1, alignItems: 'center', gap: 3 },
  statValue:   { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:   { fontSize: 11, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 36, marginVertical: 6 },
  shimmerValue: { width: 44, height: 22, borderRadius: 6, marginBottom: 5 },
  shimmerLabel: { width: 36, height: 11, borderRadius: 4 },
  quickCard:    { alignItems: 'center', gap: 7 },
  quickIconWrap:{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel:   { fontSize: 11.5, fontWeight: '500' },
  settingsRow:  { borderRadius: 12, overflow: 'hidden' },
  settingsInner:{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 12 },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel:{ flex: 1, fontSize: 15, fontWeight: '500' },
  settingsRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  group:        { gap: 8, marginHorizontal: 16, marginTop: 22 },
  groupTitle:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4 },
  groupCard:    { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
});

function makeStyles(C: CPalette) { return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },

  // Hero / banner
  hero: {
    height: 170,
    overflow: 'visible',
  },
  banner: {
    width: '100%',
    height: 170,
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -52,
    left: 20,
  },
  avatarShadow: {
    width: 104,
    height: 104,
    borderRadius: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: C.card,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
  },

  // Profile info
  infoBlock: {
    marginTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.blue,
  },
  usernameText: {
    fontSize: 14,
    color: C.sub,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C.sub,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availTrack: {
    width: 46,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  availThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  availLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 14,
    color: C.sub,
    lineHeight: 20,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primary + '40',
    backgroundColor: C.accent,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // Stats
  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: C.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  shimmerValue: {
    width: 44,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 5,
  },
  shimmerLabel: {
    width: 36,
    height: 11,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },

  // Quick access
  section: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },

  // Settings
  group: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupCardShadow: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  groupCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: 'hidden',
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowSep: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 64,
    marginRight: 16,
  },

  // Danger zone
  dangerGroup: {
    marginHorizontal: 16,
    marginTop: 22,
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.red + '30',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.red,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 13,
    color: C.sub,
    textDecorationLine: 'underline',
  },

  // CTA "Quiero ser proveedor"
  providerCtaShadow: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  providerCta: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  providerCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  providerCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerCtaText: {
    flex: 1,
    gap: 3,
  },
  providerCtaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerCtaSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },

  // Estado "pending" (KYC arrancado, sin aprobar)
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
  },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pendingSub: {
    fontSize: 12,
    lineHeight: 17,
  },
}); }


import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { toggleLikeReel, commentOnReel, Reel } from '@/features/reels/services/reels.service';
import { useAuth } from '@/features/auth/state/AuthContext';
import { getUserErrorMessage } from '@/lib/errors';
import {
  useReelsFeed,
  useDeleteReel,
  useReelComments,
  useDeleteReelComment,
  useReportReel,
} from '@/hooks/queries/useReelsQuery';
import { useFollowUser, useUnfollowUser } from '@/hooks/mutations/useFollowMutations';
import { Avatar, Button, GRADIENTS, TOKENS, toast, useThemeColors } from '@/core/design-system';

const { width: W, height: H } = Dimensions.get('window');

// ── Format number helper ──────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Action button (right sidebar) ────────────────────────────────────────────
function ActionBtn({
  icon, label, color, onPress, accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  color?: string;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress?.();
  };

  return (
    <Pressable onPress={press} style={s.actionBtn} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon} size={28} color={color ?? TOKENS.onMedia.icon} />
      </Animated.View>
      {label !== undefined && <Text style={s.actionLabel}>{label}</Text>}
    </Pressable>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ position, duration }: { position: number; duration: number }) {
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const barAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    barAnim.setValue(progress);
  }, [progress]);

  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={[
          s.progressFill,
          { width: `${progress * 100}%` },
        ]}
      />
    </View>
  );
}

// ── Floating heart (double-tap) ───────────────────────────────────────────────
function FloatingHeart({ visible, x, y }: { visible: boolean; x: number; y: number }) {
  const scaleA   = useRef(new Animated.Value(0)).current;
  const opacityA = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scaleA.setValue(0);
    opacityA.setValue(1);
    translateY.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleA, { toValue: 1.4, useNativeDriver: true, tension: 180, friction: 5 }),
        Animated.spring(scaleA, { toValue: 1.1, useNativeDriver: true, tension: 180, friction: 8 }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(opacityA,   { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -60, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.floatingHeart,
        {
          left: x - 40,
          top: y - 40,
          opacity: opacityA,
          transform: [{ scale: scaleA }, { translateY }],
        },
      ]}
    >
      <Ionicons name="heart" size={80} color={TOKENS.color.signal} />
    </Animated.View>
  );
}

// ── Comments sheet ────────────────────────────────────────────────────────────
function CommentsSheet({
  reelId,
  currentUserId,
  onClose,
  onCommentPosted,
}: {
  reelId: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentPosted: () => void;
}) {
  const insets      = useSafeAreaInsets();
  const tc          = useThemeColors();
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);

  const { data: comments = [], isLoading, isError, refetch } = useReelComments(reelId);
  const { mutate: deleteComment } = useDeleteReelComment(reelId);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await commentOnReel(reelId, text.trim());
      setText('');
      onCommentPosted();
      refetch();
    } catch (err) {
      toast.error('No se pudo comentar', getUserErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Eliminar comentario', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteComment(commentId),
      },
    ]);
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable style={[StyleSheet.absoluteFill, s.commentsBackdrop]} onPress={onClose} accessibilityLabel="Cerrar comentarios" />

        <View style={[s.commentsSheet, { paddingBottom: insets.bottom + 44, backgroundColor: tc.surface }]}>
          {/* Handle */}
          <View style={[s.commentsHandle, { backgroundColor: tc.border }]} />
          <Text style={[s.commentsTitle, { color: tc.text }]}>Comentarios</Text>

          {isLoading ? (
            <View style={s.commentsEmpty}>
              <ActivityIndicator color={tc.textSub} />
            </View>
          ) : isError ? (
            <View style={s.commentsEmpty}>
              <Ionicons name="cloud-offline-outline" size={44} color={tc.textMuted} />
              <Text style={[s.commentsEmptyText, { color: tc.textSub }]}>No pudimos cargar los comentarios</Text>
              <Pressable onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Reintentar cargar comentarios" hitSlop={8}>
                <Text style={[s.commentsRetry, { color: tc.signal }]}>Reintentar</Text>
              </Pressable>
            </View>
          ) : comments.length === 0 ? (
            <View style={s.commentsEmpty}>
              <Ionicons name="chatbubbles-outline" size={44} color={tc.textMuted} />
              <Text style={[s.commentsEmptyText, { color: tc.textSub }]}>Sé el primero en comentar</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <View style={[s.commentItem, { borderBottomColor: tc.divider }]}>
                  <View style={s.commentAvatar}>
                    <Ionicons name="person-circle" size={32} color={tc.textMuted} />
                  </View>
                  <View style={s.commentBody}>
                    <Text style={[s.commentUser, { color: tc.text }]}>{item.user.name}</Text>
                    <Text style={[s.commentText, { color: tc.textSub }]}>{item.comment}</Text>
                  </View>
                  {item.userId === currentUserId && (
                    <Pressable onPress={() => handleDeleteComment(item.id)} style={s.commentDelete} accessibilityRole="button" accessibilityLabel="Eliminar comentario">
                      <Ionicons name="trash-outline" size={16} color={tc.textMuted} />
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}

          {/* Input */}
          <View style={[s.commentsInputRow, { borderTopColor: tc.divider }]}>
            <TextInput
              style={[s.commentsInput, { backgroundColor: tc.surface2, color: tc.text }]}
              accessibilityLabel="Escribí un comentario"
              placeholder="Escribí un comentario..."
              placeholderTextColor={tc.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable onPress={handleSend} disabled={!text.trim() || sending} accessibilityRole="button" accessibilityLabel="Enviar comentario" style={[s.commentsSendBtn, { backgroundColor: tc.surface2 }]}>
              {sending
                ? <ActivityIndicator size="small" color={tc.text} />
                : <Ionicons name="send" size={20} color={text.trim() ? tc.text : tc.textMuted} />
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Before / After comparison slider ─────────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const dividerX = useRef(new Animated.Value(W / 2)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { moveX }) => {
        dividerX.setValue(Math.max(30, Math.min(W - 30, moveX)));
      },
    }),
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      {/* DESPUÉS — visible siempre, detrás */}
      <Image source={{ uri: after }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[s.baLabel, s.baLabelRight]}>
        <Text style={s.baLabelText}>DESPUÉS</Text>
      </View>

      {/* ANTES — clippeado por la posición del divider */}
      <Animated.View style={[StyleSheet.absoluteFill, { width: dividerX, overflow: 'hidden' }]}>
        <Image source={{ uri: before }} style={{ width: W, height: H }} contentFit="cover" />
        <View style={[s.baLabel, s.baLabelLeft]}>
          <Text style={s.baLabelText}>ANTES</Text>
        </View>
      </Animated.View>

      {/* Divider — línea vertical + handle */}
      <Animated.View style={[s.baDividerLine, { left: dividerX }]} pointerEvents="none">
        <View style={s.baDividerHandle}>
          <Ionicons name="chevron-back"    size={11} color={TOKENS.onMedia.canvas} />
          <Ionicons name="chevron-forward" size={11} color={TOKENS.onMedia.canvas} />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Single reel item ──────────────────────────────────────────────────────────
const ReelItem = React.memo(function ReelItem({
  reel,
  isActive,
  currentUserId,
  onNotInterested,
}: {
  reel: Reel;
  isActive: boolean;
  currentUserId?: string;
  onNotInterested: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { mutate: deleteReelMutate } = useDeleteReel();
  const { mutate: reportReelMutate } = useReportReel();
  const { mutate: followUserMutate } = useFollowUser();
  const { mutate: unfollowUserMutate } = useUnfollowUser();

  const isBeforeAfter = reel.type === 'before_after';

  const [isMuted,     setIsMuted]     = useState(true);
  const [isPaused,    setIsPaused]    = useState(false);
  const [position,    setPosition]    = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [isBuffering, setIsBuffering] = useState(!isBeforeAfter);
  const [hasError,    setHasError]    = useState(false);
  const [liked,         setLiked]         = useState(reel.isLiked ?? false);
  const [likeCount,     setLikeCount]     = useState(reel.likes ?? 0);
  const [commentCount,  setCommentCount]  = useState(reel.comments ?? 0);
  const [isFollowing,   setIsFollowing]   = useState(reel.user.isFollowing ?? false);
  const [showComments,  setShowComments]  = useState(false);

  // Heart animation state
  const [heartVisible, setHeartVisible] = useState(false);
  const [heartPos,     setHeartPos]     = useState({ x: W / 2, y: H / 2 });

  // Double-tap detection
  const lastTap = useRef(0);

  // ── expo-video player — always called (hook rule), ignored for before_after ─
  const player = useVideoPlayer({ uri: reel.videoUrl ?? '' }, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Play / pause según visibilidad (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();
      if (!isActive) {
        player.currentTime = 0;
        setIsPaused(false);
        setPosition(0);
      }
    }
  }, [isActive, isPaused, player, isBeforeAfter]);

  // Sincronizar mute con el player (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
    player.muted = isMuted;
  }, [isMuted, player, isBeforeAfter]);

  // Escuchar progreso y buffering (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
    const sub = player.addListener('timeUpdate', (e) => {
      setPosition(e.currentTime * 1000);
      setDuration((player.duration ?? 0) * 1000);
      setIsBuffering(false);
    });
    return () => sub.remove();
  }, [player, isBeforeAfter]);

  useEffect(() => {
    if (isBeforeAfter) return;
    const sub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading');
      setHasError(status === 'error');
    });
    return () => sub.remove();
  }, [player, isBeforeAfter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePress = useCallback((evt: any) => {
    if (isBeforeAfter) return;
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // Double tap → like + floating heart
      const { locationX, locationY } = evt.nativeEvent;
      setHeartPos({ x: locationX, y: locationY });
      setHeartVisible(false);
      setTimeout(() => setHeartVisible(true), 10);
      if (!liked) {
        setLiked(true);
        setLikeCount(c => c + 1);
        // Persist the like (it used to be local-only); roll back if the request fails.
        toggleLikeReel(reel.id).catch(() => {
          setLiked(false);
          setLikeCount(c => Math.max(0, c - 1));
        });
      }
    } else {
      // Single tap → toggle pause
      setIsPaused(p => !p);
    }
    lastTap.current = now;
  }, [liked, isBeforeAfter, reel.id]);

  const handleRetryVideo = useCallback(() => {
    setHasError(false);
    setIsBuffering(true);
    player.replace({ uri: reel.videoUrl ?? '' });
  }, [player, reel.videoUrl]);

  const handleLikePress = useCallback(() => {
    setLiked(l => {
      setLikeCount(c => l ? c - 1 : c + 1);
      return !l;
    });
    toggleLikeReel(reel.id).catch(() => {
      setLiked(l => {
        setLikeCount(c => l ? c - 1 : c + 1);
        return !l;
      });
    });
  }, [reel.id]);

  const handleQuote = useCallback(() => {
    router.push({
      pathname: '/(tabs)/services/provider/[id]',
      params: { id: reel.user.id, from: 'reels' },
    });
  }, [reel.user.id]);

  const handleFollow = useCallback(() => {
    setIsFollowing(f => {
      const next = !f;
      if (next) {
        followUserMutate(reel.user.id, { onError: () => setIsFollowing(false) });
      } else {
        unfollowUserMutate(reel.user.id, { onError: () => setIsFollowing(true) });
      }
      return next;
    });
  }, [reel.user.id, followUserMutate, unfollowUserMutate]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Mirá el trabajo de @${reel.user.username} en Bosko`,
        url: `https://boskoapp.site/provider/${reel.user.id}`,
      });
    } catch {}
  }, [reel.user.username, reel.user.id]);

  const handleMore = useCallback(() => {
    const isOwner = reel.user.id === currentUserId;
    const options: any[] = [
      { text: 'No me interesa', onPress: () => onNotInterested(reel.id) },
      {
        text: 'Reportar contenido',
        style: 'destructive',
        onPress: () =>
          reportReelMutate(
            { reelId: reel.id },
            {
              onSuccess: () =>
                toast.success('Reporte enviado', 'Gracias por ayudarnos a mantener la comunidad.'),
              onError: () =>
                toast.error('No se pudo enviar el reporte', 'Intentá de nuevo en unos segundos.'),
            },
          ),
      },
    ];
    if (isOwner) {
      options.push({
        text: 'Eliminar reel',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Eliminar reel', '¿Seguro que querés eliminarlo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => deleteReelMutate(reel.id),
            },
          ]),
      });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Opciones', undefined, options);
  }, [reel.id, reel.user.id, currentUserId, reportReelMutate, deleteReelMutate, onNotInterested]);

  const handleCommentPosted = useCallback(() => {
    setCommentCount(c => c + 1);
  }, []);

  const muteScale   = useRef(new Animated.Value(0)).current;
  const muteOpacity = useRef(new Animated.Value(0)).current;

  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    muteOpacity.setValue(1);
    muteScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(muteScale,   { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }),
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(muteOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };

  return (
    <View style={s.reel}>
      {/* ── Media ──────────────────────────────────────────────────────── */}
      {isBeforeAfter ? (
        <BeforeAfterSlider
          before={reel.beforeImageUrl!}
          after={reel.afterImageUrl!}
        />
      ) : (
        <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            surfaceType="textureView"
          />
        </Pressable>
      )}

      {/* ── Dark gradient overlays ──────────────────────────────────────── */}
      <LinearGradient
        colors={GRADIENTS.overlayFadeUp}
        style={s.gradTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={GRADIENTS.overlayFadeDown}
        style={s.gradBottom}
        pointerEvents="none"
      />

      {/* ── Video-only overlays ─────────────────────────────────────────── */}
      {!isBeforeAfter && isBuffering && isActive && (
        <View style={s.pauseIcon} pointerEvents="none">
          <ActivityIndicator size="large" color={TOKENS.onMedia.textSub} />
        </View>
      )}
      {!isBeforeAfter && isPaused && !isBuffering && !hasError && (
        <View style={s.pauseIcon} pointerEvents="none">
          <Ionicons name="pause" size={60} color={TOKENS.onMedia.textSub} />
        </View>
      )}
      {!isBeforeAfter && hasError && isActive && (
        <Pressable
          style={s.pauseIcon}
          onPress={handleRetryVideo}
          accessibilityRole="button"
          accessibilityLabel="No se pudo cargar el video. Tocá para reintentar"
        >
          <Ionicons name="refresh" size={44} color={TOKENS.onMedia.textSub} />
          <Text style={s.errorTitle}>No se pudo cargar el video</Text>
          <Text style={s.errorSub}>Tocá para reintentar</Text>
        </Pressable>
      )}
      {!isBeforeAfter && (
        <Animated.View
          style={[s.muteIndicator, { opacity: muteOpacity, transform: [{ scale: muteScale }] }]}
          pointerEvents="none"
        >
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={32} color={TOKENS.onMedia.icon} />
        </Animated.View>
      )}
      {!isBeforeAfter && (
        <FloatingHeart visible={heartVisible} x={heartPos.x} y={heartPos.y} />
      )}

      {/* ── Right sidebar ───────────────────────────────────────────────── */}
      <View style={[s.sidebar, { paddingBottom: insets.bottom + 80 }]}>
        {/* Avatar + follow button */}
        <Pressable
          onPress={handleFollow}
          style={s.avatarWrap}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? `Dejar de seguir a ${reel.user.username}` : `Seguir a ${reel.user.username}`}
        >
          <View style={s.avatar}>
            <Avatar uri={reel.user.avatar} name={reel.user.name || reel.user.username} size={42} />
          </View>
          <View style={[s.followDot, isFollowing && s.followDotActive]}>
            <Ionicons
              name={isFollowing ? 'checkmark' : 'add'}
              size={12}
              color={TOKENS.color.onPrimary}
            />
          </View>
        </Pressable>

        <ActionBtn
          icon={liked ? 'heart' : 'heart-outline'}
          label={fmtNum(likeCount)}
          color={liked ? TOKENS.color.signal : TOKENS.onMedia.icon}
          onPress={handleLikePress}
          accessibilityLabel={liked ? 'Quitar me gusta' : 'Me gusta'}
        />
        <ActionBtn
          icon="chatbubble-ellipses"
          label={fmtNum(commentCount)}
          onPress={() => setShowComments(true)}
          accessibilityLabel="Ver comentarios"
        />
        <ActionBtn icon="arrow-redo" label="Compartir" onPress={handleShare} accessibilityLabel="Compartir reel" />
        <ActionBtn
          icon="pricetag-outline"
          label="Cotizar"
          onPress={handleQuote}
          accessibilityLabel="Cotizar con este prestador"
        />
        <ActionBtn icon="ellipsis-horizontal" onPress={handleMore} accessibilityLabel="Más opciones" />
        {!isBeforeAfter && (
          <Pressable
            onPress={handleMuteToggle}
            style={s.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color={TOKENS.onMedia.icon} />
          </Pressable>
        )}
      </View>

      {/* ── Bottom info ─────────────────────────────────────────────────── */}
      <View style={[s.bottomInfo, { paddingBottom: insets.bottom + 72 }]}>
        {reel.user.isAvailable && (
          <View style={s.availableBadge}>
            <View style={s.availableDot} />
            <Text style={s.availableText}>Disponible hoy</Text>
          </View>
        )}
        <Text style={s.username}>@{reel.user.username}</Text>
        <Text style={s.description} numberOfLines={2}>{reel.description}</Text>
        <Text style={s.tags}>{(reel.tags ?? []).join(' ')}</Text>
        {!isBeforeAfter && reel.music && (
          <View style={s.musicRow}>
            <Ionicons name="musical-notes" size={13} color={TOKENS.onMedia.textSub} />
            <Text style={s.musicText} numberOfLines={1}>{reel.music}</Text>
          </View>
        )}

        {isBeforeAfter && (
          <View style={s.beforeAfterBadge}>
            <Ionicons name="swap-horizontal" size={12} color={TOKENS.onMedia.icon} />
            <Text style={s.beforeAfterBadgeText}>Arrastrá para comparar</Text>
          </View>
        )}

        {/* Progress bar (video only) */}
        {!isBeforeAfter && <ProgressBar position={position} duration={duration} />}
      </View>

      {/* ── Comments sheet ──────────────────────────────────────────────── */}
      {showComments && (
        <CommentsSheet
          reelId={reel.id}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCommentPosted={handleCommentPosted}
        />
      )}
    </View>
  );
});

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ insetTop }: { insetTop: number }) {
  const [tab, setTab] = useState<'siguiendo' | 'parati'>('parati');

  return (
    <View style={[s.topBar, { paddingTop: insetTop + 8 }]} pointerEvents="box-none">
      <View style={s.topTabs} pointerEvents="auto">
        <Pressable onPress={() => setTab('siguiendo')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'siguiendo' }}>
          <Text style={[s.topTab, tab === 'siguiendo' && s.topTabActive]}>Siguiendo</Text>
        </Pressable>
        <View style={s.topDivider} />
        <Pressable onPress={() => setTab('parati')} accessibilityRole="tab" accessibilityState={{ selected: tab === 'parati' }}>
          <Text style={[s.topTab, tab === 'parati' && s.topTabActive]}>Para ti</Text>
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  const currentUserId = authState.user?.id;
  const { data, isLoading, isError, isRefetching, refetch, isFetchingNextPage, fetchNextPage, hasNextPage } = useReelsFeed();
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const reels = (data?.pages.flat() ?? []).filter(r => !ignoredIds.has(r.id));
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNotInterested = useCallback((id: string) => {
    setIgnoredIds(prev => new Set(prev).add(id));
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  // viewabilityConfigCallbackPairs must be stable (useRef, never recreated)
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 60,
        minimumViewTime: 100,
      },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
          setActiveIndex(viewableItems[0].index);
        }
      },
    },
  ]);

  // renderItem depends on activeIndex — React.memo on ReelItem ensures only
  // the two items whose isActive prop actually flipped get re-rendered.
  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem
        reel={item}
        isActive={index === activeIndex}
        currentUserId={currentUserId}
        onNotInterested={handleNotInterested}
      />
    ),
    [activeIndex, currentUserId, handleNotInterested],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: H, offset: H * index, index }),
    [],
  );

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={TOKENS.onMedia.icon} />
      </View>
    );
  }

  if (isError && reels.length === 0) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar hidden />
        <Ionicons name="cloud-offline-outline" size={56} color={TOKENS.onMedia.textMuted} />
        <Text style={s.emptyTitle}>No pudimos cargar los reels</Text>
        <Text style={s.emptySubtitle}>Revisá tu conexión e intentá de nuevo.</Text>
        <Button label="Reintentar" onPress={() => refetch()} style={s.retryBtn} />
        <TopBar insetTop={insets.top} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar hidden />

      <FlatList
        data={reels}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            tintColor={TOKENS.onMedia.icon}
            colors={[TOKENS.color.signal]}
            progressViewOffset={insets.top + 48}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={s.footerLoader}>
              <ActivityIndicator color={TOKENS.onMedia.icon} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={56} color={TOKENS.onMedia.textMuted} />
            <Text style={s.emptyTitle}>Sin reels todavía</Text>
            <Text style={s.emptySubtitle}>Los proveedores aún no han publicado videos. Volvé pronto.</Text>
          </View>
        }
      />

      {/* Floating top bar */}
      <TopBar insetTop={insets.top} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TOKENS.onMedia.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.onMedia.canvas,
  },
  emptyContainer: {
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    backgroundColor: TOKENS.onMedia.canvas,
  },
  emptyTitle: {
    color: TOKENS.onMedia.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: TOKENS.onMedia.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
  },
  errorTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.onMedia.text,
  },
  errorSub: {
    fontSize: 13,
    color: TOKENS.onMedia.textSub,
  },
  footerLoader: {
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reel item
  reel: {
    width: W,
    height: H,
    backgroundColor: TOKENS.onMedia.canvas,
  },

  // Gradient overlays
  gradTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 280,
  },

  // Pause
  pauseIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mute indicator
  muteIndicator: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TOKENS.scrim.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating heart
  floatingHeart: {
    position: 'absolute',
    width: 80,
    height: 80,
  },

  // Right sidebar
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    alignItems: 'center',
    gap: 18,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: TOKENS.onMedia.solid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followDot: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.color.signal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: TOKENS.onMedia.canvas,
  },
  followDotActive: {
    backgroundColor: TOKENS.color.mint,
  },

  // Comments sheet
  commentsBackdrop: {
    backgroundColor: TOKENS.scrim.medium,
  },
  commentsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '65%',
  },
  commentsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  commentsEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  commentsEmptyText: {
    fontSize: 13,
  },
  commentsRetry: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentDelete: {
    padding: 6,
    justifyContent: 'center',
  },
  commentsInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  commentsInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  commentsSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.onMedia.text,
    textShadowColor: TOKENS.scrim.medium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 80,
    gap: 5,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.onMedia.text,
    textShadowColor: TOKENS.scrim.medium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    color: TOKENS.onMedia.text,
    lineHeight: 19,
    textShadowColor: TOKENS.scrim.medium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tags: {
    fontSize: 13,
    color: TOKENS.onMedia.textSub,
    fontWeight: '600',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  musicText: {
    fontSize: 12,
    color: TOKENS.onMedia.textSub,
    flex: 1,
  },

  // Before / After slider
  baLabel: {
    position: 'absolute',
    top: 90,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: TOKENS.scrim.medium,
    borderRadius: 6,
  },
  baLabelLeft:  { left: 12 },
  baLabelRight: { right: 12 },
  baLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: TOKENS.onMedia.text,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  baDividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: TOKENS.onMedia.solid,
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baDividerHandle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.onMedia.solid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.color.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  beforeAfterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.onMedia.fill,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  beforeAfterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: TOKENS.onMedia.text,
  },

  // Available badge
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.status.done.bg,
    borderWidth: 1,
    borderColor: TOKENS.status.done.fg,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.color.mint,
  },
  availableText: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.color.mint,
    letterSpacing: 0.2,
  },

  // Progress bar
  progressTrack: {
    height: 2,
    backgroundColor: TOKENS.onMedia.fillStrong,
    borderRadius: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TOKENS.onMedia.solid,
    borderRadius: 1,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topDivider: {
    width: 1,
    height: 16,
    backgroundColor: TOKENS.onMedia.border,
  },
  topTab: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.onMedia.textMuted,
  },
  topTabActive: {
    color: TOKENS.onMedia.text,
    textDecorationLine: 'underline',
    textDecorationColor: TOKENS.onMedia.text,
  },
  topSearch: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
});

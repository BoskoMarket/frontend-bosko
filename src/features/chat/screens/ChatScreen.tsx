/**
 * Rebrand "Señal Nocturna" — ChatScreen (chat individual): misma lógica, estado y navegación que
 * el archivo original. Mismo WebSocket + polling fallback, mismas burbujas de audio/video/documento/imagen — el acento bordo pasa a signal (burbuja propia, waveform, íconos de documento).
 */
/**
 * ChatScreen — Chat individual ligado a una orden.
 * WebSocket en tiempo real con fallback a polling REST cada 5s.
 * Soporta texto, imágenes y mensajes de audio (estilo WhatsApp).
 */

import { alertPermissionDenied } from '@/lib/permissionAlert';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Keyboard,
  Linking,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { BlurView } from '@/core/components/BlurView';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import {
  fetchConversationByOrder,
  fetchMessages,
  sendMessage as sendMsgRest,
  sendMedia,
  sendAudio,
  markAsRead,
  Message,
  Conversation,
} from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { useOrder } from '@/hooks/queries/useOrdersQuery';
import type { OrderStatus } from '@/features/orders/types/orders.types';
import { ChatOrderNotice } from '../components/ChatOrderNotice';
import { CHAT_ORDER_CLOSED_TOAST, isChatReadOnly, isOrderClosedError } from '../constants/chatOrderRules';
import {
  Avatar,
  FONT_FAMILY,
  GRADIENTS,
  NoticeBanner,
  TOKENS,
  toast,
  useIsDark,
  useThemeColors,
  withAlpha,
  type ReportSheetSubmit,
} from '@/core/design-system';
import { ReportFlow } from '@/features/reports/components/ReportFlow';
import { canReport } from '@/features/reports/canReport';
import { reportUser } from '@/features/reports/services/report.service';

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  disputed: 'En disputa',
};

const QUICK_REPLIES = ['Hola, ¿estás disponible?', '¿Cuánto sale el trabajo?'];

const POLL_INTERVAL = 10000;
const TYPING_THROTTLE = 2000;
const MAX_VIDEO_SECONDS = 60;

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const WAVE_BARS = [6, 10, 16, 8, 20, 12, 22, 10, 18, 8, 14, 10, 12, 20, 8, 10, 18, 12, 8, 16];

// ── Burbuja de audio ──────────────────────────────────────────────────────────
function AudioBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const player = useAudioPlayer(msg.mediaUrl ?? null);
  const status = useAudioPlayerStatus(player);

  const positionMs = status.currentTime * 1000;
  const durationMs = status.duration * 1000;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const timeLabel = !status.isLoaded || durationMs === 0
    ? '--:--'
    : formatDuration(status.playing || positionMs > 0 ? positionMs : durationMs);
  const accent = isMine ? TOKENS.color.onPrimary : TOKENS.color.signal;
  const accentDim = isMine ? TOKENS.color.onPrimaryDim : withAlpha(TOKENS.color.signal, 0.3);

  return (
    <View style={[styles.audioBubble]}>
      <Pressable
        onPress={togglePlay}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pausar mensaje de voz' : 'Reproducir mensaje de voz'}
        style={[styles.audioPlayBtn, { borderColor: accentDim }]}
      >
        <MaterialIcons name={status.playing ? 'pause' : 'play-arrow'} size={22} color={accent} />
      </Pressable>
      <View style={styles.waveform}>
        {WAVE_BARS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height: h, backgroundColor: progress > 0 && i / WAVE_BARS.length <= progress ? accent : accentDim },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.audioTime, { color: accent }]}>{timeLabel}</Text>
    </View>
  );
}

// ── Burbuja de video ──────────────────────────────────────────────────────────
function VideoBubble({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = false; });
  return (
    <VideoView
      player={player}
      style={styles.bubbleVideo}
      nativeControls
      contentFit="contain"
    />
  );
}

// ── Burbuja de documento ─────────────────────────────────────────────────────
function DocumentBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const filename = msg.mediaUrl?.split('/').pop()?.split('?')[0] ?? 'documento';
  const accent = isMine ? TOKENS.color.onPrimary : TOKENS.color.signal;
  return (
    <Pressable
      onPress={() => msg.mediaUrl && Linking.openURL(msg.mediaUrl)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir documento ${decodeURIComponent(filename)}`}
      style={styles.docBubble}
    >
      <MaterialIcons name="insert-drive-file" size={28} color={accent} />
      <Text style={[styles.docName, { color: accent }]} numberOfLines={2}>{decodeURIComponent(filename)}</Text>
      <MaterialIcons name="open-in-new" size={16} color={accent} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

// ── Lightbox pantalla completa ────────────────────────────────────────────────
function MediaLightbox({ uri, isVideo, visible, onClose }: { uri: string; isVideo: boolean; visible: boolean; onClose: () => void }) {
  const player = useVideoPlayer(isVideo ? uri : null, p => { if (p) { p.loop = false; } });
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.lightboxBackdrop}>
        <TouchableOpacity
          style={styles.lightboxClose}
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <MaterialIcons name="close" size={28} color={TOKENS.onMedia.icon} />
        </TouchableOpacity>
        {isVideo ? (
          <VideoView player={player} style={styles.lightboxVideo} nativeControls contentFit="contain" />
        ) : (
          <Image source={{ uri }} style={styles.lightboxImage} resizeMode="contain" />
        )}
      </View>
    </Modal>
  );
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
const MessageBubble = React.memo(function MessageBubble({ msg, myUserId }: { msg: Message; myUserId?: string }) {
  const tc = useThemeColors();
  const isMine = msg.senderId === myUserId;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (msg.messageType === 'system_event') {
    return (
      <View style={[styles.systemMessage, { backgroundColor: tc.surface2 }]}>
        <Text style={[styles.systemText, { color: tc.textSub }]}>{msg.content}</Text>
      </View>
    );
  }

  const timestamp = new Date(msg.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
  });

  const isVideo = (msg.messageType === 'file' || msg.messageType === 'image') && !!msg.mediaUrl && /\.(mp4|mov|avi|webm)$/i.test(msg.mediaUrl);
  const isImage = msg.messageType === 'image' && !!msg.mediaUrl && !isVideo;
  const isMediaBubble = isVideo || isImage;
  const statusText = msg.isRead || msg.isDelivered ? ' ✓✓' : ' ✓';

  if (isMediaBubble) {
    const mediaBorderStyle = isMine
      ? { borderRadius: 18, borderBottomRightRadius: 4 }
      : { borderRadius: 18, borderBottomLeftRadius: 4 };
    return (
      <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
        {!isMine && <Avatar name={msg.sender?.firstName} size={28} />}
        <Pressable
          style={[
            styles.mediaThumbnail,
            mediaBorderStyle,
            { borderColor: isMine ? TOKENS.onMedia.border : tc.border },
          ]}
          onPress={() => setLightboxOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={isVideo ? 'Ver video' : 'Ver imagen'}
        >
          {isVideo ? (
            <VideoBubble uri={msg.mediaUrl!} />
          ) : (
            <Image source={{ uri: msg.mediaUrl! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )}
          <View style={styles.mediaTimestampOverlay}>
            <Text style={styles.mediaTimestampText}>
              {timestamp}{isMine ? statusText : ''}
            </Text>
          </View>
        </Pressable>
        <MediaLightbox uri={msg.mediaUrl!} isVideo={isVideo} visible={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      </View>
    );
  }

  const bubbleContent = (
    <>
      {msg.messageType === 'audio' ? (
        <AudioBubble msg={msg} isMine={isMine} />
      ) : msg.messageType === 'file' && msg.mediaUrl ? (
        <DocumentBubble msg={msg} isMine={isMine} />
      ) : (
        <Text style={[styles.bubbleText, { color: isMine ? TOKENS.color.onPrimary : tc.text }]}>
          {msg.content}
        </Text>
      )}
      <Text style={[styles.bubbleTime, { color: isMine ? TOKENS.color.onPrimarySub : tc.textSub }]}>
        {timestamp}
        {isMine && (
          <Text style={msg.isRead ? styles.statusRead : styles.statusSent}>
            {statusText}
          </Text>
        )}
      </Text>
    </>
  );

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      {!isMine && <Avatar name={msg.sender?.firstName} size={28} />}
      {isMine ? (
        <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.bubbleMine]}>
          {bubbleContent}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
          {bubbleContent}
        </View>
      )}
    </View>
  );
});

// ── Indicador de grabación (reemplaza el TextInput) ───────────────────────────
function RecordingIndicator({ duration, locked, lockProgress }: { duration: number; locked?: boolean; lockProgress?: number }) {
  const tc = useThemeColors();
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const progress = lockProgress ?? 0;

  return (
    <View style={styles.recordingBar}>
      <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.recordingTimer}>{formatDuration(duration * 1000)}</Text>
      {locked ? null : progress > 0.1 ? (
        <MaterialIcons name="lock" size={16} color={TOKENS.color.signal} style={{ opacity: progress }} />
      ) : (
        <Text style={[styles.recordingHint, { color: tc.textSub }]}>← cancelar  ↑ bloquear</Text>
      )}
    </View>
  );
}

// ── Typing bubble ─────────────────────────────────────────────────────────────
function TypingBubble() {
  const tc = useThemeColors();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(480),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingBubbleRow}>
      <View style={[styles.typingBubble, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { backgroundColor: tc.textSub }, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

async function compressImage(uri: string, mimeType: string): Promise<{ uri: string; mimeType: string }> {
  if (mimeType.startsWith('video/')) return { uri, mimeType };
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    return { uri: result.uri, mimeType: 'image/jpeg' };
  } catch {
    return { uri, mimeType };
  }
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ChatScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ id: string }>();
  const { data: profile } = useProfile();
  const { authState } = useAuth();
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const insets = useSafeAreaInsets();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const { data: order, refetch: refetchOrder } = useOrder(conversation?.orderId);
  // G69: report the other participant (report only; blocking is postponed).
  const [reportOpen, setReportOpen] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const reportTargetId = conversation?.otherParty?.id;
  const reportOrderId = conversation?.orderId;
  const canReportOther = canReport(reportTargetId, profile?.id) && !!reportOrderId;
  const submitUserReport = useCallback(
    async ({ reason, details }: ReportSheetSubmit) => {
      if (!reportTargetId || !reportOrderId) return;
      await reportUser(reportTargetId, { reason, details, context: { type: 'chat', orderId: reportOrderId } });
    },
    [reportTargetId, reportOrderId],
  );
  const openChatMenu = useCallback(() => {
    Alert.alert('Opciones', undefined, [
      { text: 'Reportar usuario', style: 'destructive', onPress: () => setReportOpen(true) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);
  // G68: completed/cancelled => read-only. While the status is unknown the composer stays enabled.
  const readOnly = isChatReadOnly(order?.status);
  const refetchOrderRef = useRef(refetchOrder);
  refetchOrderRef.current = refetchOrder;
  const orderLoadedRef = useRef(false);
  orderLoadedRef.current = !!order;
  // Refresh the order status when the screen regains focus (only once it was already loaded once).
  useFocusEffect(useCallback(() => {
    if (orderLoadedRef.current) void refetchOrderRef.current();
  }, []));
  // If the backend rejects a send because the order is closed, tell the user and resync the status.
  const handleClosedOrderError = useCallback((err: unknown): boolean => {
    if (!isOrderClosedError(err)) return false;
    toast.error(CHAT_ORDER_CLOSED_TOAST);
    void refetchOrderRef.current();
    return true;
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketReady, setSocketReady] = useState(socketService.isConnected);
  const [convId, setConvId] = useState('');

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMoreRef = useRef(false);
  const nextPageRef = useRef(2);

  // Audio — usamos ref para el estado real (evita problemas de closure en onPressOut)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLocked, setRecordingLocked] = useState(false);
  const [lockProgress, setLockProgress] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const isRecordingRef = useRef(false);
  const recordingLockedRef = useRef(false);
  const recordingDurationRef = useRef(0);
  const micStartYRef = useRef(0);
  const micStartXRef = useRef(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const convIdRef = useRef<string>('');
  // Ref para acceder a conversation en stopRecording sin dependencia
  const conversationRef = useRef<Conversation | null>(null);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  const loadConversation = useCallback(async () => {
    if (!params.id) return;
    try {
      const conv = await fetchConversationByOrder(params.id);
      setConversation(conv);
      return conv.id;
    } catch {
      setLoadFailed(true);
      return params.id;
    }
  }, [params.id]);

  const busyRef = useRef(false);
  const pollBackoffRef = useRef(0);

  const loadMessages = useCallback(async (convId: string) => {
    if (pollBackoffRef.current > Date.now()) return;
    try {
      const { messages: latest, hasMore } = await fetchMessages(convId, { page: 1, limit: 50 });
      hasMoreRef.current = hasMore;
      nextPageRef.current = 2;
      setMessages(latest);
      setLoadFailed(false);
      await markAsRead(convId).catch(() => {});
    } catch (err: any) {
      if (err?.response?.status === 429) {
        pollBackoffRef.current = Date.now() + 60_000;
      }
      console.error('Error loading messages:', err);
      setLoadFailed(true);
    }
  }, []);

  const loadOlderMessages = useCallback(async (convId: string) => {
    if (!hasMoreRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const { messages: older, hasMore } = await fetchMessages(convId, { page: nextPageRef.current, limit: 50 });
      hasMoreRef.current = hasMore;
      nextPageRef.current += 1;
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOnes = older.filter(m => !existingIds.has(m.id));
        return [...prev, ...newOnes];
      });
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    setSocketReady(socketService.isConnected);
    const unsub = socketService.onConnectionChange(setSocketReady);
    return () => unsub();
  }, [authState.token]);

  useEffect(() => socketService.onMessageNotification(notification => {
    if (notification.conversationId === convIdRef.current) void loadMessages(notification.conversationId);
  }), [loadMessages]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!convId || !socketReady) return;
    void loadMessages(convId);
    socketService.joinConversation(convId);
    return () => { socketService.leaveConversation(convId); };
  }, [socketReady, convId]);

  useEffect(() => {
    const unsub = socketService.onMessageReceived((msg) => {
      if (msg.conversationId !== convIdRef.current) return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [msg, ...prev];
      });
      const preview =
        msg.messageType === 'audio' ? '🎤 Audio' :
        msg.messageType === 'image' ? '📷 Imagen' :
        msg.messageType === 'file'  ? '📎 Archivo' :
        msg.content ?? '';
      updateLastMessage(msg.conversationId, preview, msg.senderId);
      markAsRead(msg.conversationId).catch(() => {});
    });
    return () => unsub();
  }, [updateLastMessage]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      setLoadFailed(false);
      hasMoreRef.current = false;
      nextPageRef.current = 2;
      const id = await loadConversation();
      if (!id || !active) { setLoading(false); return; }
      convIdRef.current = id;
      setConvId(id);
      await loadMessages(id);
      if (!active) return;
      setLoading(false);
    };
    init();
    return () => { active = false; };
  }, [loadConversation, loadMessages, reloadKey]);

  // Polling como fallback — solo activo cuando socket no está conectado
  useEffect(() => {
    if (!convId) return;
    if (socketReady) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => loadMessages(convId), POLL_INTERVAL);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [socketReady, convId, loadMessages]);


  // ── Audio recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setShowAttachMenu(false);
    setRecordingLocked(false);
    recordingLockedRef.current = false;
    setLockProgress(0);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        alertPermissionDenied('Necesitamos acceso al micrófono para grabar mensajes de voz.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;
      setIsRecording(true);
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('No se pudo iniciar la grabación', 'Intentá de nuevo');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    isRecordingRef.current = false;
    recordingLockedRef.current = false;
    setIsRecording(false);
    setRecordingLocked(false);
    setLockProgress(0);
    const duration = recordingDurationRef.current;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (duration < 1) {
        toast.warning('Mensaje muy corto', 'Mantené presionado el micrófono para grabar');
        return;
      }
      const uri = recorder.uri;
      if (!uri) return;
      const convId = conversationRef.current?.id ?? convIdRef.current;
      if (!convId) return;
      setSendingAudio(true);
      const newMsg = await sendAudio(convId, uri);
      setMessages(prev => [newMsg, ...prev]);
      updateLastMessage(convId, `🎤 Mensaje de voz (${formatDuration(duration * 1000)})`, profile?.id ?? '');
    } catch (err) {
      console.error('Error sending audio:', err);
      if (handleClosedOrderError(err)) return;
      toast.error('No se pudo enviar el audio', 'Intentá de nuevo');
    } finally {
      setSendingAudio(false);
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    isRecordingRef.current = false;
    recordingLockedRef.current = false;
    setIsRecording(false);
    setRecordingLocked(false);
    setLockProgress(0);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
    recordingDurationRef.current = 0;
    setRecordingDuration(0);
  }, [recorder]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  // ── Media (galería) ──────────────────────────────────────────────────────
  const handlePickMedia = useCallback(async () => {
    setShowAttachMenu(false);
    if (!conversation) return;
    if (busyRef.current) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alertPermissionDenied('Necesitamos acceso a tu galería para enviar fotos y videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.4,
      allowsEditing: false,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    if (isVideo && typeof asset.duration === 'number' && asset.duration > MAX_VIDEO_SECONDS * 1000) {
      toast.warning('Video demasiado largo', `El máximo es de ${MAX_VIDEO_SECONDS} segundos.`);
      return;
    }
    const rawMime = isVideo ? 'video/mp4' : (asset.mimeType ?? 'image/jpeg');
    busyRef.current = true;
    setSending(true);
    try {
      const { uri, mimeType } = await compressImage(asset.uri, rawMime);
      const newMsg = await sendMedia(conversation.id, uri, mimeType);
      setMessages(prev => [newMsg, ...prev]);
      updateLastMessage(conversation.id, isVideo ? '🎥 Video' : '📷 Imagen', profile?.id ?? '');
    } catch (err) {
      console.error('Error sending media:', err);
      if (handleClosedOrderError(err)) return;
      toast.error('No se pudo enviar el archivo', 'Revisá tu conexión e intentá de nuevo');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  }, [conversation]);

  // ── Cámara (helper compartido) ───────────────────────────────────────────
  const launchCamera = useCallback(async (mediaTypes: ('images' | 'videos')[], isVideo: boolean) => {
    setShowAttachMenu(false);
    if (!conversation) return;
    if (busyRef.current) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alertPermissionDenied('Necesitamos acceso a tu cámara para sacar fotos y grabar videos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      quality: 0.4,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const rawMime = isVideo ? 'video/mp4' : (asset.mimeType ?? 'image/jpeg');
    busyRef.current = true;
    setSending(true);
    try {
      const { uri, mimeType } = await compressImage(asset.uri, rawMime);
      const newMsg = await sendMedia(conversation.id, uri, mimeType);
      setMessages(prev => [newMsg, ...prev]);
      updateLastMessage(conversation.id, isVideo ? '🎥 Video' : '📷 Foto', profile?.id ?? '');
    } catch (err) {
      console.error('Error sending camera media:', err);
      if (handleClosedOrderError(err)) return;
      toast.error('No se pudo enviar el archivo', 'Revisá tu conexión e intentá de nuevo');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  }, [conversation]);

  const handleCameraPhoto = useCallback(() => launchCamera(['images'], false), [launchCamera]);
  const handleCameraVideo = useCallback(() => launchCamera(['videos'], true), [launchCamera]);

  // ── Documento ────────────────────────────────────────────────────────────
  const handlePickDocument = useCallback(async () => {
    setShowAttachMenu(false);
    if (!conversation || busyRef.current) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    busyRef.current = true;
    setSending(true);
    try {
      const newMsg = await sendMedia(conversation.id, asset.uri, asset.mimeType ?? 'application/pdf');
      setMessages(prev => [newMsg, ...prev]);
      updateLastMessage(conversation.id, '📎 Documento', profile?.id ?? '');
    } catch (err) {
      console.error('Error sending document:', err);
      if (handleClosedOrderError(err)) return;
      toast.error('No se pudo enviar el documento', 'Revisá tu conexión e intentá de nuevo');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  }, [conversation]);

  // ── Texto ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || busyRef.current) return;
    if (!conversation) {
      toast.error('El chat todavía no está disponible', 'Esperá un momento o reintentá cargarlo');
      return;
    }
    busyRef.current = true;
    setInput('');
    setSending(true);
    cancelTyping();
    try {
      const newMsg = await sendMsgRest(conversation.id, text);
      setMessages(prev => [newMsg, ...prev]);
      updateLastMessage(conversation.id, text, profile?.id ?? '');
    } catch (err) {
      setInput(text);
      if (handleClosedOrderError(err)) return;
      toast.error('No se pudo enviar', 'Revisá tu conexión e intentá de nuevo');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  const cancelTyping = useCallback(() => {
    socketService.emitTyping(convIdRef.current, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    lastTypingEmitRef.current = 0;
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    if (!socketService.isConnected || !convIdRef.current) return;
    const now = Date.now();
    if (text.trim() && now - lastTypingEmitRef.current > TYPING_THROTTLE) {
      socketService.emitTyping(convIdRef.current, true);
      lastTypingEmitRef.current = now;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => socketService.emitTyping(convIdRef.current, false), TYPING_THROTTLE);
    }
    if (!text.trim()) cancelTyping();
  }, [cancelTyping]);

  useEffect(() => {
    const unsub = socketService.onTypingIndicator((data) => {
      if (data.userId === profile?.id) return;
      setIsTyping(data.isTyping);
    });
    return () => unsub();
  }, [profile?.id]);

  // Read receipts en tiempo real — el otro leyó nuestros mensajes
  useEffect(() => {
    const myId = profile?.id;
    if (!myId) return;
    const unsub = socketService.onMessagesRead((data) => {
      if (data.conversationId !== convIdRef.current) return;
      setMessages(prev =>
        prev.map(m => m.senderId === myId ? { ...m, isRead: true, isDelivered: true } : m),
      );
    });
    return () => unsub();
  }, [profile?.id]);

  useEffect(() => {
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, []);

  const myId = profile?.id;
  const other = conversation?.otherParty;
  const otherName = other
    ? `${other.firstName} ${other.lastName || ''}`.trim() || 'Chat'
    : 'Chat';
  const showMicButton = !input.trim() && !sending && !sendingAudio && !isRecording && !recordingLocked;
  const LOCK_THRESHOLD = 80;

  if (loading) {
    return (
      <View style={[styles.background, styles.centered, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <ActivityIndicator color={TOKENS.color.signal} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      style={[styles.background, { backgroundColor: tc.bg }]}
    >
      <AnimatedBackground variant="minimal" />
      {/* Header */}
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.header, { borderBottomColor: tc.divider, paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/chat')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={[styles.backButton, { backgroundColor: tc.surface }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Avatar uri={other?.avatarUrl} name={otherName} size={40} />
          <View>
            <Text style={[styles.headerName, { color: tc.text }]} numberOfLines={1}>{otherName}</Text>
          </View>
        </View>
        {conversation?.orderId && (
          <Pressable
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: conversation.orderId } })}
            accessibilityRole="button"
            accessibilityLabel="Ver la orden"
            style={[styles.headerOrderBtn, { backgroundColor: tc.accent }]}
          >
            <MaterialIcons name="description" size={19} color={TOKENS.color.signal} />
          </Pressable>
        )}
        {canReportOther && (
          <Pressable
            onPress={openChatMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Más opciones del chat"
            style={[styles.headerOrderBtn, { backgroundColor: tc.surface }]}
          >
            <MaterialIcons name="more-vert" size={22} color={tc.text} />
          </Pressable>
        )}
      </BlurView>

      <ReportFlow
        visible={reportOpen}
        title="Reportar usuario"
        message="Contanos por qué querés reportar a esta persona. El equipo de Bosko lo va a revisar."
        onClose={closeReport}
        submit={submitUserReport}
      />

      {/* Barra de contexto de la orden — el chat siempre pertenece a una orden */}
      {conversation?.orderId && order && (
        <Pressable
          style={[styles.orderBar, { backgroundColor: tc.accent, borderBottomColor: tc.border }]}
          onPress={() => router.push({ pathname: '/orders/[id]', params: { id: conversation.orderId } })}
          accessibilityRole="button"
          accessibilityLabel={`Ver la orden: ${order.service?.title ?? order.title}`}
        >
          <MaterialIcons name="work-outline" size={16} color={TOKENS.color.signal} />
          <View style={styles.orderBarText}>
            <Text style={[styles.orderBarTitle, { color: tc.text }]} numberOfLines={1}>
              {order.service?.title ?? order.title}
            </Text>
            <Text style={styles.orderBarMeta}>
              ORDEN #{order.id.slice(-5).toUpperCase()} · {ORDER_STATUS_LABEL[order.status].toUpperCase()}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color={TOKENS.color.signal} />
        </Pressable>
      )}

      {/* Sin conexión en tiempo real: los mensajes llegan por polling */}
      {!socketReady && !!convId && (
        <NoticeBanner variant="pending" icon="cloud-offline-outline" style={styles.offlineBanner}>
          Sin conexión en tiempo real. Los mensajes nuevos pueden tardar en aparecer.
        </NoticeBanner>
      )}

      {/* Mensajes */}
      <FlatList
        ref={listRef}
        data={messages}
        inverted
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} myUserId={myId} />}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        onEndReached={() => { if (convId) loadOlderMessages(convId); }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={TOKENS.color.signal} style={{ padding: 12 }} /> : null}
        ListEmptyComponent={
          loadFailed ? (
            <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
              <View style={[styles.emptyChatIconWrap, { backgroundColor: tc.accent }]}>
                <MaterialIcons name="cloud-off" size={34} color={TOKENS.color.signal} />
              </View>
              <Text style={[styles.emptyChatText, { color: tc.text }]}>No pudimos cargar el chat</Text>
              <Text style={[styles.emptyChatSubtext, { color: tc.textSub }]}>Revisá tu conexión e intentá de nuevo</Text>
              <Pressable
                onPress={() => setReloadKey(k => k + 1)}
                accessibilityRole="button"
                accessibilityLabel="Reintentar cargar el chat"
                style={[styles.quickReplyChip, { backgroundColor: tc.surface2, borderColor: tc.border }]}
              >
                <Text style={[styles.quickReplyText, { color: tc.text }]}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
          <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
            <View style={[styles.emptyChatIconWrap, { backgroundColor: tc.accent }]}>
              <MaterialIcons name="forum" size={34} color={TOKENS.color.signal} />
            </View>
            <Text style={[styles.emptyChatText, { color: tc.text }]}>Conversación iniciada</Text>
            <Text style={[styles.emptyChatSubtext, { color: tc.textSub }]}>Enviá el primer mensaje para empezar</Text>
            <View style={styles.quickRepliesRow}>
              {QUICK_REPLIES.map((reply) => (
                <Pressable
                  key={reply}
                  style={[styles.quickReplyChip, { backgroundColor: tc.surface2, borderColor: tc.border }]}
                  onPress={() => setInput(reply)}
                  accessibilityRole="button"
                  accessibilityLabel={`Usar respuesta rápida: ${reply}`}
                >
                  <Text style={[styles.quickReplyText, { color: tc.text }]}>{reply}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          )
        }
        style={styles.messagesList}
      />

      {isTyping && <View style={{ transform: [{ scaleY: -1 }] }}><TypingBubble /></View>}

      {/* Menú de adjuntar */}
      {showAttachMenu && !readOnly && (
        <View style={[styles.attachMenu, { backgroundColor: tc.surface, borderTopColor: tc.divider }]}>
          <Pressable onPress={handleCameraPhoto} style={styles.attachOption} accessibilityRole="button" accessibilityLabel="Sacar una foto">
            <LinearGradient colors={GRADIENTS.brand} style={styles.attachIcon}>
              <MaterialIcons name="camera-alt" size={20} color={TOKENS.color.onPrimary} />
            </LinearGradient>
            <Text style={[styles.attachOptionText, { color: tc.textSub }]}>Foto</Text>
          </Pressable>
          <Pressable onPress={handleCameraVideo} style={styles.attachOption} accessibilityRole="button" accessibilityLabel="Grabar un video">
            <LinearGradient colors={GRADIENTS.brand} style={styles.attachIcon}>
              <MaterialIcons name="videocam" size={20} color={TOKENS.color.onPrimary} />
            </LinearGradient>
            <Text style={[styles.attachOptionText, { color: tc.textSub }]}>Video</Text>
          </Pressable>
          <Pressable onPress={handlePickMedia} style={styles.attachOption} accessibilityRole="button" accessibilityLabel="Elegir de la galería">
            <LinearGradient colors={GRADIENTS.brand} style={styles.attachIcon}>
              <MaterialIcons name="photo-library" size={20} color={TOKENS.color.onPrimary} />
            </LinearGradient>
            <Text style={[styles.attachOptionText, { color: tc.textSub }]}>Galería</Text>
          </Pressable>
          <Pressable onPress={handlePickDocument} style={styles.attachOption} accessibilityRole="button" accessibilityLabel="Adjuntar un documento">
            <LinearGradient colors={GRADIENTS.brand} style={styles.attachIcon}>
              <MaterialIcons name="insert-drive-file" size={20} color={TOKENS.color.onPrimary} />
            </LinearGradient>
            <Text style={[styles.attachOptionText, { color: tc.textSub }]}>Documento</Text>
          </Pressable>
        </View>
      )}

      {/* Input bar */}
      {order?.status === 'disputed' && <ChatOrderNotice status={order.status} style={styles.orderNotice} />}
      {readOnly ? (
        <ChatOrderNotice status={order?.status} style={{ ...styles.orderNotice, marginBottom: Math.max(insets.bottom, 12) }} />
      ) : (
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: tc.divider }]}>
        <View style={[
          styles.inputWrapper,
          { borderColor: inputFocused ? TOKENS.color.signal : tc.border },
        ]}>
          {/* Botón izquierdo */}
          {isRecording || recordingLocked ? (
            <Pressable onPress={cancelRecording} hitSlop={8} style={styles.leftBtn} accessibilityRole="button" accessibilityLabel="Descartar grabación">
              <MaterialIcons name="delete" size={22} color={TOKENS.color.error} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowAttachMenu(v => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showAttachMenu ? 'Cerrar adjuntos' : 'Adjuntar archivo'}
              style={({ pressed }) => [styles.leftBtn, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name={showAttachMenu ? 'close' : 'attach-file'} size={22} color={tc.textSub} />
            </Pressable>
          )}

          {/* Centro */}
          {isRecording || recordingLocked ? (
            <RecordingIndicator duration={recordingDuration} locked={recordingLocked} lockProgress={lockProgress} />
          ) : sendingAudio ? (
            <ActivityIndicator color={TOKENS.color.signal} size="small" style={{ flex: 1 }} />
          ) : (
            <TextInput
              style={[styles.input, { color: tc.text }]}
              value={input}
              onChangeText={handleInputChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              accessibilityLabel="Mensaje"
              placeholder="Escribí un mensaje..."
              placeholderTextColor={tc.textSub}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          )}

          {/* Botón derecho */}
          {recordingLocked ? (
            // Modo bloqueado: checkmark verde para enviar
            <Pressable onPress={stopRecording} style={[styles.rightBtn, styles.rightBtnSend]} accessibilityRole="button" accessibilityLabel="Enviar mensaje de voz">
              <MaterialIcons name="check" size={22} color={TOKENS.color.onPrimary} />
            </Pressable>
          ) : !isRecording && !showMicButton ? (
            // Tiene texto: enviar
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !input.trim() || sending }}
              style={[styles.rightBtn, (!input.trim() || sending) && { backgroundColor: tc.surface2 }]}
            >
              {!!input.trim() && !sending && (
                <LinearGradient colors={GRADIENTS.brand} style={styles.rightBtnGradient} />
              )}
              {sending ? <ActivityIndicator color={TOKENS.color.onPrimary} size="small" /> : <MaterialIcons name="send" size={20} color={TOKENS.color.onPrimary} />}
            </Pressable>
          ) : (
            // Micrófono: View con responder para gesture de slide
            <View
              style={[styles.rightBtn, isRecording && styles.rightBtnRecording]}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Mantené presionado para grabar un mensaje de voz"
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                micStartYRef.current = e.nativeEvent.pageY;
                micStartXRef.current = e.nativeEvent.pageX;
                startRecording();
              }}
              onResponderMove={(e) => {
                if (recordingLockedRef.current) return;
                const dy = micStartYRef.current - e.nativeEvent.pageY;
                const dx = micStartXRef.current - e.nativeEvent.pageX;
                // Slide left → cancel
                if (dx >= 80 && isRecordingRef.current) {
                  cancelRecording();
                  return;
                }
                // Slide up → lock
                const progress = Math.min(Math.max(dy / LOCK_THRESHOLD, 0), 1);
                setLockProgress(progress);
                if (dy >= LOCK_THRESHOLD) {
                  recordingLockedRef.current = true;
                  setRecordingLocked(true);
                  setLockProgress(0);
                }
              }}
              onResponderRelease={() => {
                if (recordingLockedRef.current) return;
                setLockProgress(0);
                if (isRecordingRef.current) stopRecording();
              }}
              onResponderTerminate={() => {
                if (!recordingLockedRef.current && isRecordingRef.current) cancelRecording();
              }}
            >
              {!isRecording && <LinearGradient colors={GRADIENTS.brand} style={styles.rightBtnGradient} />}
              <MaterialIcons name="mic" size={20} color={TOKENS.color.onPrimary} />
            </View>
          )}
        </View>
      </BlurView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  backButton: { padding: 6, borderRadius: 10 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { fontSize: 16, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  headerOrder: { fontSize: 12, marginTop: 1 },
  headerOrderBtn: {
    width: 38, height: 38, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  orderBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  orderBarText: { flex: 1, minWidth: 0 },
  orderBarTitle: { fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  orderBarMeta: {
    fontSize: 10, fontWeight: '700', fontFamily: FONT_FAMILY.mono,
    letterSpacing: 0.8, textTransform: 'uppercase', color: TOKENS.color.signal,
  },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 8, flexGrow: 1 },
  systemMessage: {
    alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginVertical: 4,
  },
  systemText: { fontSize: 12, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMine: {
    borderBottomRightRadius: 4,
    shadowColor: TOKENS.color.signal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 3,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  mediaThumbnail: {
    width: 220, height: 165,
    overflow: 'hidden',
    backgroundColor: TOKENS.onMedia.canvas,
    borderWidth: 1,
  },
  mediaTimestampOverlay: {
    position: 'absolute', bottom: 6, right: 8,
    backgroundColor: TOKENS.scrim.medium,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 8,
  },
  mediaTimestampText: { color: TOKENS.onMedia.text, fontSize: 10 },
  bubbleImage: { width: 220, height: 165 },
  bubbleVideo: { width: 220, height: 165, backgroundColor: TOKENS.onMedia.canvas },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  lightboxBackdrop: {
    flex: 1, backgroundColor: TOKENS.scrim.heavy,
    alignItems: 'center', justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute', top: 48, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: TOKENS.onMedia.fill,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  lightboxImage: { width: SCREEN_W, height: SCREEN_H * 0.85 },
  lightboxVideo: { width: SCREEN_W, height: SCREEN_H * 0.75 },
  // Audio bubble
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2, minWidth: 180 },
  audioPlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  waveBar: { width: 3, borderRadius: 2 },
  audioTime: { fontSize: 11, fontWeight: '600', minWidth: 32 },
  // Document bubble
  docBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, minWidth: 160, maxWidth: 220 },
  docName: { flex: 1, fontSize: 13, fontWeight: '500' },
  // Attach menu
  attachMenu: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  attachOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attachIcon: {
    width: 44, height: 44, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    ...TOKENS.shadow.glow,
  },
  attachOptionText: { fontSize: 11, fontWeight: '500' },
  // Input bar
  inputBar: {
    padding: 12,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  leftBtn: { padding: 4 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingTop: 4 },
  rightBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: TOKENS.color.signal,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  rightBtnGradient: { ...StyleSheet.absoluteFillObject },
  rightBtnRecording: { backgroundColor: TOKENS.color.error },
  rightBtnSend: { backgroundColor: TOKENS.color.mint },
  rightBtnDisabled: {},
  rightBtnPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
  // Recording
  recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: TOKENS.color.error },
  recordingTimer: { fontSize: 15, fontWeight: '700', color: TOKENS.color.error, minWidth: 36 },
  recordingHint: { flex: 1, fontSize: 12 },
  // Empty + typing
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8, paddingHorizontal: 32 },
  emptyChatIconWrap: {
    width: 76, height: 76, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyChatText: { fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY.display },
  emptyChatSubtext: { fontSize: 14, textAlign: 'center' },
  quickRepliesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    justifyContent: 'center', marginTop: 8,
  },
  quickReplyChip: {
    borderWidth: 1, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  quickReplyText: { fontSize: 13, fontWeight: '500' },
  typingBubbleRow: { paddingHorizontal: 16, paddingVertical: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusSent: { color: TOKENS.color.onPrimarySub },
  statusRead: { color: TOKENS.color.mint },
  offlineBanner: { marginHorizontal: 12, marginTop: 8 },
  orderNotice: { marginHorizontal: 12, marginTop: 8 },
});

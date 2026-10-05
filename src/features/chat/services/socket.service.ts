import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/core/config/env';
import type { Message } from './chat.service';

const SOCKET_URL = API_URL.replace(/\/api\/v\d+.*$/, '');
export type MessageNotification = { conversationId: string; senderId: string; preview?: string };
type Typing = { conversationId?: string; userId: string; isTyping: boolean };
type ReadReceipt = { conversationId: string; readBy?: string };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';
export function isChatMessage(value: unknown): value is Message {
  return object(value) && ['id', 'conversationId', 'senderId', 'createdAt', 'messageType'].every(key => typeof value[key] === 'string')
    && typeof value.content === 'string';
}
class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private rooms = new Set<string>();
  private messages = new Set<(value: Message) => void>();
  private notifications = new Set<(value: MessageNotification) => void>();
  private typing = new Set<(value: Typing) => void>();
  private connections = new Set<(value: boolean) => void>();
  private reads = new Set<(value: ReadReceipt) => void>();
  get isConnected() { return this.socket?.connected ?? false; }
  connect(token: string) {
    if (this.socket && this.token === token) { this.reconnect(); return; }
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.connections.forEach(cb => cb(false));
    this.token = token;
    const socket = io(SOCKET_URL, {
      auth: { token }, transports: ['websocket', 'polling'], reconnection: true,
      reconnectionAttempts: Infinity, reconnectionDelay: 2000, reconnectionDelayMax: 30000,
    });
    this.socket = socket;
    socket.on('connect', () => {
      this.rooms.forEach(conversationId => socket.emit('join_conversation', { conversationId }));
      this.connections.forEach(cb => cb(true));
    });
    socket.on('disconnect', () => this.connections.forEach(cb => cb(false)));
    socket.on('message_received', (msg: unknown) => {
      if (isChatMessage(msg)) this.messages.forEach(cb => cb(msg));
    });
    socket.on('new_message_notification', (data: unknown) => {
      if (!object(data) || typeof data.conversationId !== 'string' || typeof data.senderId !== 'string') return;
      const notification = { conversationId: data.conversationId, senderId: data.senderId,
        preview: typeof data.preview === 'string' ? data.preview : undefined };
      this.notifications.forEach(cb => cb(notification));
    });
    socket.on('typing_indicator', (data: unknown) => {
      if (object(data) && typeof data.userId === 'string' && typeof data.isTyping === 'boolean') {
        this.typing.forEach(cb => cb({ userId: data.userId as string, isTyping: data.isTyping as boolean,
          conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined }));
      }
    });
    socket.on('messages_read', (data: unknown) => {
      if (object(data) && typeof data.conversationId === 'string') this.reads.forEach(cb => cb({
        conversationId: data.conversationId as string, readBy: typeof data.readBy === 'string' ? data.readBy : undefined,
      }));
    });
  }
  reconnect() { if (this.socket && !this.socket.connected && !this.socket.active) this.socket.connect(); }
  disconnect() {
    this.socket?.removeAllListeners(); this.socket?.disconnect(); this.socket = null; this.token = null;
    this.rooms.clear(); this.connections.forEach(cb => cb(false));
    this.messages.clear(); this.notifications.clear(); this.typing.clear(); this.connections.clear(); this.reads.clear();
  }
  joinConversation(id: string) { this.rooms.add(id); this.socket?.emit('join_conversation', { conversationId: id }); }
  leaveConversation(id: string) { this.rooms.delete(id); this.socket?.emit('leave_conversation', { conversationId: id }); }
  sendMessage(conversationId: string, content: string, type = 'text') { this.socket?.emit('send_message', { conversationId, content, type }); }
  emitTyping(conversationId: string, isTyping: boolean) { this.socket?.emit('typing_indicator', { conversationId, isTyping }); }
  onMessageReceived(cb: (value: Message) => void) { this.messages.add(cb); return () => { this.messages.delete(cb); }; }
  onMessageNotification(cb: (value: MessageNotification) => void) { this.notifications.add(cb); return () => { this.notifications.delete(cb); }; }
  onTypingIndicator(cb: (value: Typing) => void) { this.typing.add(cb); return () => { this.typing.delete(cb); }; }
  onConnectionChange(cb: (value: boolean) => void) { this.connections.add(cb); return () => { this.connections.delete(cb); }; }
  onMessagesRead(cb: (value: ReadReceipt) => void) { this.reads.add(cb); return () => { this.reads.delete(cb); }; }
}
export const socketService = new SocketService();

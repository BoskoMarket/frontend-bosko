import { io } from 'socket.io-client';
import { socketService } from '@/features/chat/services/socket.service';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));
let handlers: Record<string, (data?: any) => void>;
let socket: any;
beforeEach(() => {
  handlers = {};
  socket = { connected: false, active: false, on: jest.fn((name, cb) => { handlers[name] = cb; }), emit: jest.fn(), removeAllListeners: jest.fn(), disconnect: jest.fn(), connect: jest.fn() };
  jest.mocked(io).mockReturnValue(socket);
});
afterEach(() => { socketService.disconnect(); jest.clearAllMocks(); });
test('un aviso resumido nunca se inserta como mensaje', () => {
  const message = jest.fn(), notice = jest.fn();
  socketService.onMessageReceived(message); socketService.onMessageNotification(notice);
  socketService.connect('token');
  handlers.new_message_notification({ conversationId: 'c', senderId: 'u', preview: 'Hola' });
  handlers.message_received({ conversationId: 'c', senderId: 'u' });
  expect(message).not.toHaveBeenCalled();
  expect(notice).toHaveBeenCalledWith({ conversationId: 'c', senderId: 'u', preview: 'Hola' });
});
test('reconecta con la credencial nueva y recupera las salas', () => {
  socketService.connect('old');
  socketService.joinConversation('c');
  socketService.connect('new');
  expect(socket.disconnect).toHaveBeenCalledTimes(1);
  expect(io).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'new' }, reconnectionAttempts: Infinity }));
  socket.emit.mockClear(); handlers.connect();
  expect(socket.emit).toHaveBeenCalledWith('join_conversation', { conversationId: 'c' });
});
test('logout descarta las salas de la cuenta anterior', () => {
  socketService.connect('a'); socketService.joinConversation('private-a'); socketService.disconnect();
  socketService.connect('b'); socket.emit.mockClear(); handlers.connect();
  expect(socket.emit).not.toHaveBeenCalled();
});

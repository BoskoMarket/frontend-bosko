import api from "@/core/api/axiosinstance";


export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: string;
    read: boolean;
}

export interface Chat {
    id: string;
    participants: {
        id: string;
        name: string;
        avatar?: string;
    }[];
    lastMessage?: Message;
    unreadCount: number;
    updatedAt: string;
}

export interface CreateChatDto {
    recipientId: string;
}

export interface SendMessageDto {
    content: string;
}

// Endpoints based on standard conventions since none were found
export async function getChats(): Promise<Chat[]> {
    const { data } = await api.get<Chat[]>('/chat/history');
    return data;
}

export async function getChatById(id: string): Promise<Chat> {
    const { data } = await api.get<Chat>(`/chat/history/${id}`);
    return data;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/chats/${chatId}/messages`);
    return data;
}

export async function createChat(recipientId: string): Promise<Chat> {
    const { data } = await api.post<Chat>('/chats', { recipientId });
    return data;
}

export async function sendMessage(chatId: string, content: string): Promise<Message> {
    const { data } = await api.post<Message>(`/chats/${chatId}/messages`, { content });
    return data;
}

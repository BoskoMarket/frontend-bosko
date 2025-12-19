import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chat, Message, getChats, getChatMessages, sendMessage, createChat } from '@/src/services/chat.service';
import { useAuth } from './AuthContext';

interface ChatContextType {
    chats: Chat[];
    currentChatMessages: Message[];
    loading: boolean;
    error: string | null;
    fetchChats: () => Promise<void>;
    loadChatMessages: (chatId: string) => Promise<void>;
    sendNewMessage: (chatId: string, content: string) => Promise<void>;
    startNewChat: (recipientId: string) => Promise<Chat | null>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { authState } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChats = useCallback(async () => {
        if (!authState?.token) return;
        try {
            setLoading(true);
            const data = await getChats();
            setChats(data);
        } catch (err: any) {
            console.error('Error fetching chats:', err);
            // Don't set error prominentally to avoid blocking UI on minor fetch fails
        } finally {
            setLoading(false);
        }
    }, [authState?.token]);

    const loadChatMessages = async (chatId: string) => {
        try {
            // setMessageLoading(true); // Fine grained loading state if needed
            const messages = await getChatMessages(chatId);
            setCurrentChatMessages(messages);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            setError(err.message || 'Failed to load messages');
        }
    };

    const sendNewMessage = async (chatId: string, content: string) => {
        try {
            const newMessage = await sendMessage(chatId, content);
            setCurrentChatMessages(prev => [...prev, newMessage]);
            // Optimistically update chat list last message
            setChats(prev => prev.map(c =>
                c.id === chatId
                    ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() }
                    : c
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        } catch (err: any) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    const startNewChat = async (recipientId: string) => {
        try {
            const newChat = await createChat(recipientId);
            setChats(prev => [newChat, ...prev]);
            return newChat;
        } catch (err: any) {
            console.error('Error creating chat:', err);
            throw err;
        }
    };

    useEffect(() => {
        if (authState?.token) {
            fetchChats();
        }
    }, [authState?.token, fetchChats]);

    return (
        <ChatContext.Provider value={{
            chats,
            currentChatMessages,
            loading,
            error,
            fetchChats,
            loadChatMessages,
            sendNewMessage,
            startNewChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

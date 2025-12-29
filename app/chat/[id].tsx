import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Colors from "@/core/design-system/Colors";
import { useChat } from "@/features/servicesUser/state/ChatContext";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const { loadChatMessages, sendNewMessage, currentChatMessages, chats } =
    useChat();

  // Find current chat info from cached chats list for header info
  const chatInfo = chats.find((c) => c.id === id);
  const participant = chatInfo?.participants[0] || {
    name: "Unknown User",
    avatar: "https://i.pravatar.cc/150",
  };

  useEffect(() => {
    if (id) {
      loadChatMessages(id as string);
    }
  }, [id]);

  const handleSend = async () => {
    if (!message.trim() || !id) return;
    try {
      await sendNewMessage(id as string, message);
      setMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    // Assume simplified identification for "me" vs "them"
    // If senderId matches participant id, it's THEM. Otherwise ME.
    // Ideally checking against currentUserId is safer.
    const isMe = item.senderId !== participant.id;

    if (isMe) {
      return (
        <View style={styles.myMessageContainer}>
          <LinearGradient
            colors={["#ff6b6b", "#ee5253"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.myMessageBubble}
          >
            <Text style={styles.myMessageText}>{item.content}</Text>
            <Text style={styles.myMessageTime}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={styles.theirMessageContainer}>
        <View style={styles.theirMessageBubble}>
          <Text style={styles.theirMessageText}>{item.content}</Text>
          <Text style={styles.theirMessageTime}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ff4b4b" />
          </Pressable>

          <View style={styles.headerProfile}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?u=" + id }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>Kathy Gomez</Text>
              <Text style={styles.headerStatus}>Typing...</Text>
            </View>
          </View>

          <Pressable style={styles.callButton}>
            <View style={styles.callButtonCircle}>
              <Ionicons name="call" size={20} color="#ff4b4b" />
            </View>
          </Pressable>
        </View>

        {/* Messages */}
        {/* Messages */}
        <FlatList
          data={currentChatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.dateSeparator}>Today</Text>}
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          style={styles.inputWrapper}
        >
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: insets.bottom + 10 },
            ]}
          >
            <Pressable style={styles.attachButton}>
              <Ionicons name="happy-outline" size={24} color="#ff4b4b" />
            </Pressable>

            <TextInput
              placeholder="Type a message"
              placeholderTextColor={Colors.premium.textTertiary}
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSend}
            />

            <View style={styles.rightActions}>
              <Pressable style={styles.iconAction}>
                <Ionicons name="attach" size={24} color="#ff4b4b" />
              </Pressable>
              <Pressable style={styles.iconAction}>
                <Ionicons name="camera-outline" size={24} color="#ff4b4b" />
              </Pressable>

              <Pressable style={styles.micButton} onPress={handleSend}>
                <LinearGradient
                  colors={["#ff6b6b", "#ee5253"]}
                  style={styles.micGradient}
                >
                  <Ionicons
                    name={message.trim() ? "send" : "mic"}
                    size={20}
                    color="#fff"
                  />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.premium.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.premium.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.premium.textPrimary,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.premium.textSecondary,
  },
  callButton: {
    padding: 5,
  },
  callButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 75, 75, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 20,
    paddingBottom: 100,
  },
  dateSeparator: {
    textAlign: "center",
    color: Colors.premium.textTertiary,
    marginBottom: 20,
    fontSize: 12,
  },
  myMessageContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  myMessageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4, // Subtle adjustment
    // Shadow for bubble
    shadowColor: "#ee5253",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  myMessageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  theirMessageContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  theirMessageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    backgroundColor: "#1E1E24", // Neumorphic dark
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  theirMessageText: {
    color: Colors.premium.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  theirMessageTime: {
    color: Colors.premium.textTertiary,
    fontSize: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  inputWrapper: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#16161a", // Slightly lighter than bg
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    height: 40,
    color: "#fff",
    fontSize: 16,
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconAction: {
    padding: 4,
  },
  micButton: {
    marginLeft: 4,
    shadowColor: "#ee5253",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  micGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

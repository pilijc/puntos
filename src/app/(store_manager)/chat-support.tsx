import React, { useState } from "react";
import { Platform, KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, LayoutAnimation } from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Send, Paperclip, ArrowLeft, Headset } from "lucide-react-native";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'store_manager' | 'super_admin';
  timestamp: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    text: "Hello! Our team is available to assist you. How can we help today?",
    sender: "super_admin",
    timestamp: "10:00 AM",
  },
  {
    id: "2",
    text: "I want to confirm how the monthly billing limit is calculated across different branches.",
    sender: "store_manager",
    timestamp: "10:05 AM",
  },
  {
    id: "3",
    text: "Certainly. The monthly billing applies to your owner account, covering all branch streams under a single umbrella.",
    sender: "super_admin",
    timestamp: "10:06 AM",
  }
];

export default function ChatSupportScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const insets = useSafeAreaInsets();
  const scrollBottom = Math.max(insets.bottom, 40);
  const isWeb = Platform.OS === "web";
  const router = useRouter();

  const handleSend = () => {
    if (!message.trim()) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "store_manager",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900 border-x-0">
      {/* Header */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-neutral-800 pl-6 pr-4 py-3 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <ArrowLeft size={22} color="#1e293b" className="dark:text-white" />
        </TouchableOpacity>

        <View className="w-10 h-10 ml-4 mr-3 rounded-full bg-slate-100 dark:bg-neutral-800 items-center justify-center">
          <Headset size={20} color="#64748b" />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight">
            Contact Support
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: Math.max(scrollBottom, 20),
            ...(isWeb ? { alignItems: "center" as const } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full flex-row justify-center mb-6">
            <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Today
            </Text>
          </View>

          <View style={{ maxWidth: isWeb ? 896 : undefined }} className="w-full flex-1">
            {messages.map((msg, index) => {
              const isManager = msg.sender === "store_manager";
              const nextMsg = messages[index + 1];
              const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;

              return (
                <View
                  key={msg.id}
                  className={`mb-1 max-w-[80%] ${isManager ? "self-end" : "self-start"} ${isLastInGroup ? 'mb-5' : ''}`}
                >
                  <View
                    className={`px-4 py-3 ${isManager
                        ? "bg-primary"
                        : "bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-neutral-800"
                      } ${isManager
                        ? (isLastInGroup ? "rounded-t-2xl rounded-bl-2xl rounded-br-[4px]" : "rounded-2xl rounded-br-[4px]")
                        : (isLastInGroup ? "rounded-t-2xl rounded-br-2xl rounded-bl-[4px]" : "rounded-2xl rounded-bl-[4px]")
                      }`}
                  >
                    <Text
                      className={`text-[15px] font-poppins leading-6 ${isManager
                          ? "text-white"
                          : "text-slate-800 dark:text-slate-100"
                        }`}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  {isLastInGroup && (
                    <Text
                      className={`text-[11px] font-poppins text-slate-400 dark:text-neutral-500 mt-1.5 ${isManager ? "text-right" : "text-left ml-1"
                        }`}
                    >
                      {msg.timestamp}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Input Area */}
        <View
          className="px-4 py-3 bg-white dark:bg-darkBackground border-t border-neutral-100 dark:border-darkBorder flex-row items-end justify-center"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TouchableOpacity 
            className="w-[44px] h-[44px] items-center justify-center rounded-full active:bg-slate-50 dark:active:bg-neutral-800"
            style={{ marginBottom: 18, marginLeft: 8 }}
          >
            <Paperclip size={20} color="#94a3b8" />
          </TouchableOpacity>

          <View className="flex-1 mx-5 bg-slate-50 dark:bg-neutral-800 rounded-3xl px-4 py-1 flex-row items-center border border-transparent focus:border-slate-300 dark:focus:border-slate-700 min-h-[44px]">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message support..."
              placeholderTextColor="#94a3b8"
              className="flex-1 py-3 font-poppins text-[15px] text-textPrimary dark:text-darkTextPrimary outline-none max-h-[120px]"
              multiline
              textAlignVertical="center"
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            className={`w-[44px] h-[44px] rounded-full items-center justify-center ${message.trim() ? "bg-primary" : "bg-transparent"}`}
            style={{ marginBottom: 16, marginRight: 8 }}
          >
            <Send
              size={20}
              color={message.trim() ? "#ffffff" : "#cbd5e1"}
              style={message.trim() ? { marginLeft: -2 } : {}}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

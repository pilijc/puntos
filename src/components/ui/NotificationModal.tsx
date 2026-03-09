import React from "react";
import { Modal, ScrollView, TouchableOpacity, View as RNView } from "react-native";
import { View, Text } from "@/tw"; // Use your TW wrapper
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ICON_COLOR_MAP: Record<string, string> = {
  registration: "#3B82F6",
  action: "#FF6600",
  alert: "#EF4444",
  default: "#64748B"
};

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  data: any[];
  onMarkRead: (id: string) => void;
}

export const NotificationModal = ({ visible, onClose, data, onMarkRead }: NotificationModalProps) => (
  <Modal visible={visible} animationType="slide" transparent>
    {/* Background Overlay */}
    <RNView className="flex-1 bg-black/40 justify-end">
      
      {/* Modal Container */}
      <View className="bg-white rounded-t-[28px] pt-3 pb-8 max-h-[65%]">
        {/* Handle Bar */}
        <View className="w-9 h-1 bg-backgroundMuted rounded-full self-center mb-5" />
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 mb-4">
          <Text className="text-base font-poppins-bold text-textPrimary">Notifications</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={20} color="#94A3B8"/>
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {data.map((n: any) => (
            <TouchableOpacity 
              key={n.id} 
              onPress={() => onMarkRead(n.id)} 
              className={`flex-row px-6 py-3.5 ${n.unread ? 'bg-primary/5' : 'bg-white'}`}
            >
              {/* Icon Container with dynamic opacity background */}
              <RNView 
                style={{ backgroundColor: (ICON_COLOR_MAP[n.type] || ICON_COLOR_MAP.default) + "15" }} 
                className="w-9 h-9 rounded-full items-center justify-center mr-3.5"
              >
                <MaterialIcons 
                  name={n.icon} 
                  size={18} 
                  color={ICON_COLOR_MAP[n.type] || ICON_COLOR_MAP.default}
                />
              </RNView>
              
              <View className="flex-1">
                <Text className="text-[13px] font-poppins-bold text-textPrimary">{n.title}</Text>
                <Text className="text-[12px] font-poppins text-textSecondary">{n.message}</Text>
                <Text className="text-[10px] font-poppins text-textMuted mt-0.5">{n.time}</Text>
              </View>
              
              {/* Unread Dot */}
              {n.unread && (
                <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              )}
            </TouchableOpacity>
          ))}
          {data.length === 0 && (
            <Text className="text-center py-10 text-textMuted font-poppins">No notifications</Text>
          )}
        </ScrollView>
      </View>
    </RNView>
  </Modal>
);
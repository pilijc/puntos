import React from "react";
import { Image } from "react-native";
import { View, Text } from "@/tw";
import { Button } from "@/components/button";

const SOFT_CARD_SHADOW = {};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "#16A34A", dot: "#22C55E", bg: "#F0FDF4" },
  PENDING: { label: "Pending", color: "#2563EB", dot: "#3B82F6", bg: "#EFF6FF" }, 
  INACTIVE: { label: "Inactive", color: "#DC2626", dot: "#EF4444", bg: "#FEF2F2" },
};

type StoreCardProps = {
  store: any;
  onEdit?: (store: any) => void;
  onActivate?: (store: any) => void;
  onDeactivate?: (store: any) => void;
};

export const StoreCard = ({ store, onEdit, onActivate, onDeactivate }: StoreCardProps) => {
  const status = store.status?.toUpperCase() ?? "INACTIVE";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["INACTIVE"];
  const isActive = status === "ACTIVE";

  return (
    <View 
      style={[SOFT_CARD_SHADOW, { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" }]}
      className="mb-2"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row flex-1 items-center">
          <Image
            source={{ uri: store.logo || store.image || `https://api.dicebear.com/7.x/identicon/png?seed=${store.name || store.id}` }}
            style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#F1F5F9" }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-[14px] font-poppins-bold text-textPrimary">{store.name}</Text>
            {store.location && <Text className="text-[11px] font-poppins text-textMuted">{store.location}</Text>}
          </View>
        </View>

        {/* Status Badge */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: cfg.bg, 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 20 
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot, marginRight: 6 }} />
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => onEdit?.(store)}
            fullWidth
          />
        </View>
        <View className="flex-1">
          {isActive ? (
            <Button
              label="Deactivate"
              variant="danger"
              onPress={() => onDeactivate?.(store)}
              fullWidth
            />
          ) : (
            <Button
              label="Activate"
              variant="success"
              onPress={() => onActivate?.(store)}
              fullWidth
            />
          )}
        </View>
      </View>
    </View>
  );
};
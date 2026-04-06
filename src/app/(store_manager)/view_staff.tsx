import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import {
  getAllStampsByStoreId,
  getCollectorsByProgramId,
  getCollectorsCountByProgramId,
  endStampProgram,
  getProgramStatus,
} from "@/services/store-manager/stamp-service";
import { ProgramStatus, Stamp, StampCollector, TabKey, Tabs } from "@/type/store-manager/stamp";
import { Reward } from "@/type/store-manager/reward";
import { ModalButton } from "@/components/modal";

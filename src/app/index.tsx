import { Redirect } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function Index() {
  if (Platform.OS === "web") {
    return <Redirect href="/(onboarding)/landing" />;
  }
  return <Redirect href="/(onboarding)/splash" />;
}

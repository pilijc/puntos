import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: "Discover" }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ title: "Rewards" }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History" }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Tabs>
  );
}

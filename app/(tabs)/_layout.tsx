import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Visual options for the navigation bar
        tabBarActiveTintColor: '#8b5a2b',
        tabBarInactiveTintColor: '#706b5e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e6e1d6',
          // Give it a nice height on web/mobile
          height: Platform.OS === 'web' ? 60 : 85, 
          paddingBottom: Platform.OS === 'web' ? 0 : 20,
        },
        headerStyle: {
          backgroundColor: '#f7f5f0',
        },
        headerTintColor: '#2c2a27',
      }}
    >
      {/* This maps to your index.tsx (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          // If you want icons later, you would configure them here
        }}
      />
      
      {/* This maps to your settings.tsx (Settings) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

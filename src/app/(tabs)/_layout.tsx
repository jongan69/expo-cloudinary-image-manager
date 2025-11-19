import { Tabs } from 'expo-router';
import { SignedIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <SignedIn>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#007AFF',
        }}
      >
        <Tabs.Screen
          name="photos"
          options={{
            title: 'Photos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="images" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SignedIn>
  );
}


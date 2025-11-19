import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { ToastRoot } from '../utils/toast';

const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || 
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

export default function RootLayout() {
  if (!clerkPublishableKey) {
    console.warn('CLERK_PUBLISHABLE_KEY not set. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file.');
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={clerkPublishableKey}>
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <ToastRoot />
      </>
    </ClerkProvider>
  );
}


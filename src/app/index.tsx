import { Redirect } from 'expo-router';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function Index() {
  return (
    <>
      <SignedIn>
        <Redirect href="/(tabs)/photos" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/(auth)/sign-in" />
      </SignedOut>
    </>
  );
}

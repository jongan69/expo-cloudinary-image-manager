import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';

type EmailCodeFirstFactor = {
  strategy: 'email_code';
  emailAddressId: string;
};

const parseClerkError = (error: any) => {
  try {
    if (!error) return 'Something went wrong. Please try again.';
    if (typeof error === 'string') return error;

    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      const messages = error.errors
        .map((err: any) => {
          if (typeof err === 'string') return err;
          if (err && typeof err === 'object') {
            return err.longMessage || err.message || err.code || String(err);
          }
          return null;
        })
        .filter(Boolean);
      if (messages.length > 0) return messages.join('\n');
    }

    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    if (error.statusText) return error.statusText;
    if (error.status) return `Error ${error.status}`;

    return 'Something went wrong. Please try again.';
  } catch {
    return 'Something went wrong. Please try again.';
  }
};

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0] || ''}***`;
  return `${maskedLocal}@${domain}`;
};

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSentTo, setLastSentTo] = useState('');
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);

  const requestEmailCode = async () => {
    if (!isLoaded) {
      setError('Clerk is still loading. Please wait...');
      return;
    }

    if (!emailAddress) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn.create({ identifier: emailAddress });
      const emailCodeFactor = signIn.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'email_code'
      ) as EmailCodeFirstFactor | undefined;

      if (!emailCodeFactor || !emailCodeFactor.emailAddressId) {
        throw new Error('Email code sign-in is not available for this account.');
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setEmailAddressId(emailCodeFactor.emailAddressId);
      setPendingVerification(true);
      setLastSentTo(emailAddress);
      Alert.alert('Check your email', 'We just sent you a verification code.');
    } catch (err: any) {
      const errorMessage = parseClerkError(err);
      setError(errorMessage);
      Alert.alert('Sign-in Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!isLoaded) {
      setError('Clerk is still loading. Please wait...');
      return;
    }

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (Platform.OS === 'web') {
          router.push('/(tabs)/photos');
        } else {
          router.replace('/(tabs)/photos');
        }
      } else {
        const errorMsg = `Verification incomplete. Status: ${signInAttempt.status}`;
        setError(errorMsg);
        Alert.alert('Verification Incomplete', errorMsg);
      }
    } catch (err: any) {
      const errorMessage = parseClerkError(err);
      setError(errorMessage);
      Alert.alert('Verification Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !lastSentTo || !emailAddressId) return;
    setLoading(true);
    setError('');

    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId,
      });
      Alert.alert('Code sent', 'We just sent you a new verification code.');
    } catch (err: any) {
      const errorMessage = parseClerkError(err);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && !loading) {
      if (Platform.OS === 'web') {
        router.push('/(tabs)/photos');
      } else {
        router.replace('/(tabs)/photos');
      }
    }
  }, [isSignedIn, loading, router]);

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit verification code sent to {maskEmail(lastSentTo)}
        </Text>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={verificationCode}
          placeholder="123456"
          onChangeText={(code) => {
            setVerificationCode(code);
            setError('');
          }}
          keyboardType="number-pad"
          editable={!loading}
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={verifyEmailCode}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={resendCode}
          disabled={loading || !emailAddressId}
        >
          <Text style={styles.link}>Resend code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            setPendingVerification(false);
            setVerificationCode('');
            setError('');
            setEmailAddressId(null);
          }}
        >
          <Text style={styles.link}>Use a different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Enter your email address to receive a verification code.</Text>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        onChangeText={(emailAddress) => {
          setEmailAddress(emailAddress);
          setError('');
        }}
        keyboardType="email-address"
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled ]}
        onPress={requestEmailCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send verification code</Text>
        )}
      </TouchableOpacity>
      <View style={styles.linkContainer}>
        <Text>Don't have an account? </Text>
        <Link href="/(auth)/sign-up">
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 4,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
});

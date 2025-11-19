import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecureTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const SecureTextInput: React.FC<SecureTextInputProps> = ({
  style,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={!isVisible}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setIsVisible(!isVisible)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isVisible ? 'eye-off' : 'eye'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 45,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
    zIndex: 1,
  },
});


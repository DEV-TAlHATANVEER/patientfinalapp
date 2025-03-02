import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { theme } from '../../config/theme';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Reauthenticate the user with the current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update the password
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Change Password</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          label="Current Password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Confirm New Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          mode="outlined"
        />
        <Button
          mode="contained"
          onPress={handleChangePassword}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Update Password
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  form: {
    marginTop: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: theme.colors.primary,
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import env from './env';

const ForgetPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [newPassword, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    console.log('handleReset started');

    if (!email.trim()) {
      console.log('Email is empty');
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      console.log('New password or confirm password is empty');
      Alert.alert('Error', 'Please enter your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      console.log('Proceeding to reset password...');
      setLoading(true);

      const resetResponse = await axios.put(
        `${env.baseURL}/users/update-password?email=${email}&newPassword=${newPassword}`,
        {}, // Empty body for URL parameters
        {headers: {'Content-Type': 'application/json'}}
      );

      console.log('Response from /users/update-password:', resetResponse.data);

      // Check if response contains expected message
      if (
        resetResponse.data === 'Password updated successfully.' ||
        resetResponse.data.success
      ) {
        console.log('Password reset successful');
        Alert.alert('Success', 'Password has been reset successfully.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        console.log('Password reset failed');
        Alert.alert('Error', 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      console.log('handleReset ended');
    }
  };

  return (
    <FastImage
      style={styles.container}
      source={require('./assets/login.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
      <LinearGradient
        colors={['#d3e4f6', '#a1d1ff']}
        style={styles.modeContainer}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.title}>Reset Password</Text>
        <View style={styles.input}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#000"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#000"
            value={newPassword}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.input}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#000"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleReset}
            disabled={loading}>
            <Text style={styles.signupButtonText}>
              {loading ? 'Processing...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>
    </FastImage>
  );
};

export default ForgetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeContainer: {
    width: '90%',
    alignItems: 'center',
    padding: '5%',
    borderRadius: 10,
  },
  input: {
    width: '100%',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    height: 40,
  },
  btn: {
    width: 150,
    borderRadius: 10,
    elevation: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  signupButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 7,
  },
  signupButtonText: {
    fontWeight: '500',
    color: '#ffffff',
    fontSize: 20,
    textAlign:'center',
  },
  img2: {
    width: 200,
    height: 100,
    marginHorizontal: 65,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
    color: '#4e4b51',
    fontWeight: '600',
  },
});

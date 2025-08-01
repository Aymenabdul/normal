import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import axios from 'axios'; // Import Axios
import { WebView } from 'react-native-webview'; // Import WebView for LinkedIn OAuth
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from './env';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userData, setUserData] = useState(null); // To store LinkedIn user details

  useEffect(() => {
    Alert.alert(
      'Wezume',
      'If you are a recruiter, please use your official email address.',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
      { cancelable: false }
    );
  }, []);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Validation Error', 'Both email and password are required!');
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(
      `${env.baseURL}/api/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { firstName, jobOption, userId, industry, videos, college, roleCode, jobRole } = response.data;
    const videoId =
      Array.isArray(videos) && videos.length > 0 && videos[0]?.videoId
        ? videos[0].videoId
        : null;

    if (firstName) {
      if (jobRole) {
        // If jobRole exists, it's from PlacementLogin, navigate to role selection screen and store required data
        await savePlacementLoginData(userId, firstName, email, college, roleCode);
        navigation.navigate('RoleSelection');  // Navigating to role selection for PlacementLogin
      } else {
        // If jobRole is not present, handle the login for normal users (Employee, Employer, etc.)
        if (
          jobOption === 'Employee' ||
          jobOption === 'Entrepreneur' ||
          jobOption === 'Freelancer'
        ) {
          await saveStorage(userId, firstName, email, jobOption, industry, videoId, college, roleCode);
          navigation.navigate('home1');
        }
        // Employer-like roles
        else if (jobOption === 'Employer' || jobOption === 'Investor') {
          await saveStorage(userId, firstName, email, jobOption, industry, videoId);
          navigation.navigate('HomeScreen', {
            firstName,
            email,
            jobOption,
            userId,
            industry,
          });
        }
      }

      setEmail('');
      setPassword('');
    } else {
      Alert.alert('Error', 'User data is incomplete.');
    }
  } catch (error) {
    console.error(
      'Login failed:',
      error.response ? error.response.data : error.message
    );
    Alert.alert('Login Failed', 'Invalid email or password!');
  } finally {
    setLoading(false);
  }
};

// Save PlacementLogin specific data in AsyncStorage
const savePlacementLoginData = async (userId, firstName, email, college, roleCode) => {
  try {
    await AsyncStorage.setItem('userId', userId.toString());
    await AsyncStorage.setItem('firstName', firstName);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('college', college || ''); // Save college
    await AsyncStorage.setItem('roleCode', roleCode || ''); // Save roleCode
  } catch (error) {
    console.error('Error saving PlacementLogin data to AsyncStorage:', error);
  }
};

  const saveStorage = async (
    userId,
    firstName,
    email,
    jobOption,
    industry,
    videoId,
    college,
    roleCode
  ) => {
    try {
      await AsyncStorage.setItem('userId', userId.toString());
      await AsyncStorage.setItem('firstName', firstName);
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('jobOption', jobOption);
      await AsyncStorage.setItem('industry', industry || '');
      await AsyncStorage.setItem('college', college || ''); // Save college
      await AsyncStorage.setItem('roleCode', roleCode || ''); // Save roleCode

      if (videoId !== null && videoId !== 'null') {
        await AsyncStorage.setItem('videoId', videoId.toString());
      } else {
        await AsyncStorage.removeItem('videoId');
      }
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  const handleLinkedInLogin = () => {
    setShowLinkedInModal(true);
  };

  const getQueryParams = (url) => {
    const params = {};
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const queryString = urlParts[1];
      const pairs = queryString.split('&');
      pairs.forEach((pair) => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }
    return params;
  };

  const handleWebViewNavigationStateChange = async (navState) => {
    if (
      navState.url.startsWith(
        'https://www.linkedin.com/developers/tools/oauth/redirect'
      )
    ) {
      const params = getQueryParams(navState.url);
      const code = params.code;

      if (code) {
        setShowLinkedInModal(false); // Close the LinkedIn modal
        setLoading(true);
        try {
          const response = await axios.post(`${env.baseURL}/auth/linkedin`, {
            code,
          });
          const { given_name, email, picture } = response.data; // 'picture' contains the URL

          if (given_name && email && picture) {
            // Check if email is already signed up
            const userResponse = await axios.get(`${env.baseURL}/users/check`, {
              params: { email },
            });

            if (userResponse.data.exists) {
              // User exists, log them in (Skip role selection)
              console.log('User already signed up, logging in...');
              const { userId, jobOption, firstName, phoneNumber } =
                userResponse.data;
              await AsyncStorage.setItem('userId', JSON.stringify(userId));
              await AsyncStorage.setItem('firstName', firstName);

              if (phoneNumber) {
                // Navigate based on jobOption
                if (
                  jobOption === 'Employee' ||
                  jobOption === 'Entrepreneur' ||
                  jobOption === 'Freelancer'
                ) {
                  console.log('Navigating to home1...');
                  navigation.navigate('home1', {
                    firstName,
                    email,
                    jobOption,
                    userId,
                  });
                } else if (
                  jobOption === 'Employer' ||
                  jobOption === 'Investor'
                ) {
                  console.log('Navigating to HomeScreen...');
                  navigation.navigate('HomeScreen', {
                    firstName,
                    email,
                    jobOption,
                    userId,
                  });
                }
              } else {
                // User does not have a phone number, navigate to EditScreen
                console.log('Navigating to EditScreen...');
                navigation.navigate('Edit', {
                  firstName: given_name,
                  email,
                  jobOption,
                  userId,
                });
              }
            } else {
              // User doesn't exist, show role selection
              setUserData({ given_name, email, picture });
              setShowRoleSelection(true);
            }
          } else {
            Alert.alert('Error', 'User data is incomplete.');
          }
        } catch (error) {
          console.error(
            'Error during LinkedIn login:',
            error.response ? error.response.data : error.message
          );
          Alert.alert(
            'Login Failed',
            error.response
              ? error.response.data
              : 'Could not retrieve user data.'
          );
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleRoleSelect = async (role) => {
    if (!userData) {
      console.log('No user data available. Exiting handleRoleSelect.');
      return;
    }

    const { email, given_name } = userData;
    console.log('User data received:', { email, given_name });

    const college = userData.college || ''; // Replace with the appropriate value
    const roleCode = userData.roleCode || ''; // Replace with the appropriate value

    try {
      const response = await axios.get(`${env.baseURL}/users/check`, {
        params: { email },
      });

      if (response.status === 200 && response.data.exists) {
        console.log('User already exists in the database.');
        const { jobOption, userId, firstName } = response.data;

        await saveStorage(userId, firstName, email, jobOption, response.data.industry, response.data.videoId, college, roleCode);

        setShowRoleSelection(false);

        if (jobOption === 'Employer' && isPublicDomain(email)) {
          Alert.alert(
            'Restricted Email',
            'Public email domains are not allowed for recruiters.',
            [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
          );
          return;
        }

        if (role === 'Employer' || role === 'Investor') {
          navigation.navigate('HomeScreen', {
            firstName,
            email,
            jobOption,
            userId,
          });
        } else if (role === 'Employee' || role === 'Entrepreneur') {
          navigation.navigate('home1', {
            firstName,
            email,
            jobOption,
            userId,
          });
        }
      } else {
        await saveStorage(userData.userId, userData.firstName, userData.email, role, userData.industry, null, college, roleCode);
        navigation.navigate('HomeScreen', {
          firstName: userData.firstName,
          email: userData.email,
          jobOption: role,
          userId: userData.userId,
        });
      }
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      Alert.alert(
        'Alert',
        'Please check and verify your email to continue.\n(Note: Check your spam folder as well.)',
        [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
      );
    }
  };

  return (
    <FastImage
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
      <LinearGradient colors={['#d3e4f6', '#a1d1ff']} style={styles.ModelGradient}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.loginhead}>Login</Text>
        <TouchableOpacity style={styles.linkedinButton} onPress={handleLinkedInLogin}>
          <Text style={styles.linkedinButtonText}>LinkedIn</Text>
        </TouchableOpacity>

        <Modal visible={showLinkedInModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <WebView
              source={{
                uri: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=869zn5otx0ejyt&redirect_uri=https://www.linkedin.com/developers/tools/oauth/redirect&scope=profile%20email%20openid',
              }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
            />

            <Button title="Close" onPress={() => setShowLinkedInModal(false)} />
          </View>
        </Modal>

        <View style={styles.dividerContainer}>
          <View style={styles.horizontalLine} />
          <Text style={styles.dividerText}>or Login with</Text>
          <View style={styles.horizontalLine} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
          <Text style={{ color: '#000', textAlign: 'right', fontSize: 16, paddingBottom: "3%" }}>
            Forget Password ?
          </Text>
        </TouchableOpacity>

        <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
          <TouchableOpacity style={styles.signupButton} onPress={handleLogin}>
            <Text style={styles.signupButtonText}>Login</Text>
          </TouchableOpacity>
        </LinearGradient>
        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
          <Text style={styles.createAccount}>
            Don't Have An Account ? <Text style={{ color: 'blue' }}> SignUp</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('PlacemenntSignup')}>
          <Text style={styles.createAccount}>
            want to Signup as a placement officer or Academy manager ? <Text style={{ color: 'blue' }}>click Here</Text>
          </Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loadingIndicator}
          />
        )}

        <Modal visible={showRoleSelection} animationType="fade" transparent={false}>
          <View style={styles.roleSelectionContainer}>
            <Text style={styles.title}>Select Your Role</Text>
            {['Employer', 'Freelancer', 'Employee', 'Entrepreneur', 'Investor'].map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.roleButton}
                onPress={() => handleRoleSelect(role)}>
                <Text style={styles.roleText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      </LinearGradient>
    </FastImage>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  img: {
    width: 300,
    height: 350,
    marginBottom: -70,
  },
  ModelGradient: {
    width: '90%',
    borderColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingHorizontal: 15,
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255,0.7)',
    borderRadius: 10,
    marginTop: -50,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#187bcd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 7,
    color: 'black',
    backgroundColor: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  createAccount: {
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 17,
  },
  linkedinButton: {
    backgroundColor: '#ffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  linkedinButtonText: {
    color: '#0077B5',
    fontSize: 20,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  img2: {
    width: 200,
    height: 100,
    marginTop: -60,
    marginHorizontal: 65,
  },
  loginhead: {
    width: '100%',
    marginHorizontal: 145,
    marginTop: -41,
    marginBottom: 10,
    fontSize: 24,
    fontWeight: '500',
    color: '#4e4b51',
  },
  loginsub: {
    width: '100%',
    marginLeft: 40,
    marginTop: 7,
    marginBottom: 7,
  },
  signupButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 7,
  },
  signupButtonText: {
    fontWeight: '500',
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
  },
  btn: {
    width: 150,
    marginHorizontal: 100,
    borderRadius: 10,
    elevation: 5,
  },
  createAccount: {
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  horizontalLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#0B0705',
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#24252B',
  },
  roleSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButton: {
    padding: 10,
    marginVertical: 10,
    width: '80%',
    backgroundColor: 'lightblue',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 22,
    color: '#ffffff',
  },
});

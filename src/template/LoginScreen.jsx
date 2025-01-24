import React, {useState} from 'react';
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
import {WebView} from 'react-native-webview'; // Import WebView for LinkedIn OAuth
import {useNavigation} from '@react-navigation/native';
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

  // Function to handle standard login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Both email and password are required!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${env.baseURL}/api/login`,
        {email, password},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const {firstName, jobOption, userId, industry, videos} = response.data;

      console.log('====================================');
      console.log('joboption in loginScreen ',jobOption);
      console.log('====================================');

      console.log('API Response:', response.data);

      if (Array.isArray(videos) && videos.length > 0 && videos[0]) {
        const videoId = videos[0].videoId || null; // Use null if videoId is not available
        console.log('Extracted videoId:', videoId);
      } else {
        // If no videos are found, videoId is null
        const videoId = null;
      }
      if (firstName && jobOption) {
        // Check jobOption to navigate to the appropriate screen
        if (
          jobOption === 'Employee' ||
          jobOption === 'Entrepreneur' ||
          jobOption === 'Freelancer'
        ) {
          // Use videoId (which might be null) for storage
          await saveStorage(
            userId,
            firstName,
            jobOption,
            industry,
            videos[0] ? videos[0].videoId : null,
          );
          navigation.navigate('home1');
        } else if (jobOption === 'Employer' || jobOption === 'Investor') {
          // Save the user data without videoId if not available
          await saveStorage(userId, firstName, jobOption, industry);
          navigation.navigate('HomeScreen', {
            firstName,
            jobOption,
            userId,
            industry,
          });
        }
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Error', 'User data is incomplete.');
      }
    } catch (error) {
      console.log('hii', error);
      console.error(
        'Login failed:',
        error.response ? error.response.data : error.message,
      );
      Alert.alert('Login Failed', 'Invalid email or password!');
    } finally {
      setLoading(false);
    }
  };

  const saveStorage = async (
    userId,
    firstName,
    jobOption,
    industry,
    videoId,
  ) => {
    try {
      await AsyncStorage.setItem('userId', JSON.stringify(userId));
      await AsyncStorage.setItem('firstName', firstName);
      await AsyncStorage.setItem('jobOption', jobOption);
      await AsyncStorage.setItem('industry', industry);
      await AsyncStorage.setItem('videoId', JSON.stringify(videoId));
      // Conditionally store or remove the videoId
      console.log('stored userId', userId);
      console.log('stored videoId', videoId);
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  // Function to initiate LinkedIn login
  const handleLinkedInLogin = () => {
    setShowLinkedInModal(true);
  };

  // Custom function to extract query parameters from a URL
  const getQueryParams = url => {
    const params = {};
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const queryString = urlParts[1];
      const pairs = queryString.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }
    return params;
  };
  // Function to handle WebView navigation state changes
  // Function to handle WebView navigation state changes
  const handleWebViewNavigationStateChange = async navState => {
    if (
      navState.url.startsWith(
        'https://www.linkedin.com/developers/tools/oauth/redirect',
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
          const {given_name, email, picture} = response.data; // 'picture' contains the URL

          if (given_name && email && picture) {

            // Check if email is already signed up
            const userResponse = await axios.get(`${env.baseURL}/users/check`, {
              params: {email},
            });

            if (userResponse.data.exists) {
              // User exists, log them in (Skip role selection)
              console.log('User already signed up, logging in...');
              const {userId, jobOption,firstName} = userResponse.data;
              await AsyncStorage.setItem('userId',JSON.stringify(userId));// Assuming userResponse contains userId and jobOption
              await AsyncStorage.setItem('firstName',firstName);

              // Navigate based on jobOption
              if (jobOption === 'Employee' || jobOption === 'Entrepreneur' || jobOption === 'Freelancer') {
                console.log('Navigating to HomeScreen...');
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
                console.log('Navigating to home1...');
                navigation.navigate('HomeScreen', {
                  firstName,
                  email,
                  jobOption,
                  userId,
                });
              }
            } else {
              // User doesn't exist, show role selection
              setUserData({given_name, email, picture});
              setShowRoleSelection(true);
            }
          } else {
            Alert.alert('Error', 'User data is incomplete.');
          }
        } catch (error) {
          console.error(
            'Error during LinkedIn login:',
            error.response ? error.response.data : error.message,
          );
          Alert.alert(
            'Login Failed',
            error.response
              ? error.response.data
              : 'Could not retrieve user data.',
          );
        } finally {
          setLoading(false);
        }
      }
    }
    handleRoleSelect(); // Make sure this is not running prematurely
  };

  const handleRoleSelect = async role => {
    if (!userData) {
      console.log('No user data available. Exiting handleRoleSelect.');
      return;
    }

    const {email, given_name} = userData;
    console.log('User data received:', {email, given_name});

    try {
      // Step 1: Check if the user exists in the database
      console.log('Checking if user exists in the database...');
      const response = await axios.get(`${env.baseURL}/users/check`, {
        params: {email},
      });

      console.log('Database response:', response.data);

      if (response.status === 200 && response.data.exists) {
        console.log('User already exists in the database.');

        // Retrieve jobOption, userId, and firstName from the response
        const {jobOption, userId, firstName} = response.data;

        // Store data in AsyncStorage
        await AsyncStorage.setItem('userId', JSON.stringify(userId));
        await AsyncStorage.setItem('firstName', firstName);

        // Close the role selection modal
        setShowRoleSelection(false);

        // Navigate based on jobOption
        if (jobOption === 'Employer' || jobOption === 'Investor') {
          console.log('Navigating to HomeScreen...');
          navigation.navigate('HomeScreen', {
            firstName: given_name,
            email,
            jobOption,
            userId,
          });
        } else if (jobOption === 'Employee' || jobOption === 'Entrepreneur') {
          console.log('Navigating to home1...');
          navigation.navigate('home1', {
            firstName: given_name,
            email,
            jobOption,
            userId,
          });
        }
      } else {
        console.log('User does not exist. Prompting for role selection.');

        // Ensure role is selected
        if (!role) {
          console.error('Role not selected. Prompting user.');
          Alert.alert('Error', 'Please select a role before continuing.');
          return;
        }

        // Save the user details only after role is selected
        console.log('Saving new user details to the database...');
        const saveResponse = await axios.post(`${env.baseURL}/users`, {
          firstName: given_name,
          email,
          jobOption: role,
        });

        console.log('Save response:', saveResponse.data);

        if (saveResponse.status === 201) {
          console.log('User details saved successfully.');

          // Store new user details in AsyncStorage
          await AsyncStorage.setItem(
            'userId',
            JSON.stringify(saveResponse.data.userId),
          ); // Assuming userId is returned
          await AsyncStorage.setItem('firstName', given_name);

          console.log('New user details stored in AsyncStorage.');
          // Close the role selection modal
          setShowRoleSelection(false);

          // Navigate based on the selected role
          if (role === 'Employer' || role === 'Investor') {
            console.log('Navigating to HomeScreen...');
            navigation.navigate('HomeScreen', {
              firstName: given_name,
              email,
              jobOption: role,
              userId: saveResponse.data.userId,
            });
          } else if (role === 'Employee' || role === 'Entrepreneur') {
            console.log('Navigating to home1...');
            navigation.navigate('home1', {
              firstName: given_name,
              email,
              jobOption: role,
              userId: saveResponse.data.userId,
            });
          }
        } else {
          console.error('Failed to save user details.');
          Alert.alert(
            'Error',
            'Failed to save user details. Please try again.',
          );
        }
      }
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <FastImage
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
      {/* <Image style={styles.img} source={require('./assets/Png-01.png')} /> */}
      <LinearGradient
        colors={['#d3e4f6', '#a1d1ff']}
        style={styles.ModelGradient}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.loginhead}>Login</Text>
        {/* <Text style={styles.loginsub}>Welcome back , you've been missed!</Text> */}
        <TouchableOpacity
          style={styles.linkedinButton}
          onPress={handleLinkedInLogin}>
          <Text style={styles.linkedinButtonText}>LinkedIn</Text>
        </TouchableOpacity>

        <Modal
          visible={showLinkedInModal}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalContainer}>
            <WebView
              source={{
                uri: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=869zn5otx0ejyt&redirect_uri=https://www.linkedin.com/developers/tools/oauth/redirect&scope=profile%20email%20openid', // Replace with your values
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

        <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
          <TouchableOpacity style={styles.signupButton} onPress={handleLogin}>
            <Text style={styles.signupButtonText}>Login</Text>
          </TouchableOpacity>
        </LinearGradient>
        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
          <Text style={styles.createAccount}>
            Don't Have An Account ? <Text style={{color: 'blue'}}> SignUp</Text>
          </Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loadingIndicator}
          />
        )}
        <Modal
          visible={showRoleSelection}
          animationType="fade"
          transparent={false}>
          <View style={styles.roleSelectionContainer}>
            <Text style={styles.title}>Select Your Role</Text>
            {[
              'Employer',
              'Freelancer',
              'Employee',
              'Entrepreneur',
              'Investor',
            ].map(role => (
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
  },
  createAccount: {
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
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
    transform: [{translateX: -20}, {translateY: -20}],
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
    fontSize: 20,
  },
  btn: {
    width: 150,
    marginHorizontal: 100,
    borderRadius: 10,
    elevation: 5,
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
    fontSize: 16,
    color: '#555',
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

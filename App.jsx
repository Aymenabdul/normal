import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Linking} from 'react-native';
import notifee from '@notifee/react-native';

// Import Screens
import Initial from './src/template/initialScreen';
import LoginScreen from './src/template/LoginScreen';
import SignupScreen from './src/template/SignupScreen';
import HomeScreen from './src/template/HomeScreen';
import home1 from './src/template/home1';
import OnboardingScreen from './src/template/onboarding';
import CameraScreen from './src/template/camera';
import Profile from './src/template/Profile';
import Transcribe from './src/template/transcribe';
import Account from './src/template/account';
import LikeScreen from './src/template/likedvideo';
import Edit from './src/template/Edit';
import Filtered from './src/template/filterd';
import Trending from './src/template/trending';
import Myvideos from './src/template/myvideos';
import ForgetPassword from './src/template/forgetpassword';
import VideoScreen from './src/template/VideoScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const navigationRef = useRef(null); // ✅ Correct way to use navigation reference
  useEffect(() => {
    /** ✅ Create notification channel */
    const createNotificationChannel = async () => {
      try {
        console.log('Creating notification channel for the owner...');
        await notifee.createChannel({
          id: 'owner-channel',
          name: 'Owner Notifications',
          importance: 4, // High priority for immediate attention
          sound: 'default',
          vibrate: true,
        });
        console.log('Owner channel created successfully!');
      } catch (error) {
        console.error('Error creating owner notification channel:', error);
      }
    };
    createNotificationChannel();

    /** ✅ Handle deep link navigation */
    const handleDeepLink = event => {
      console.log('Received deep link:', event.url);
      if (event.url) {
        handleURLNavigation(event.url);
      }
    };

    // ✅ Use the new approach
    const linkingListener = Linking.addEventListener('url', handleDeepLink);

    // ✅ Get the initial URL when app is launched from a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        handleURLNavigation(url);
      }
    });

    return () => {
      linkingListener.remove(); // ✅ Clean up listener on unmount
    };
  }, []);

  /** ✅ Function to handle deep link navigation */
  const handleURLNavigation = url => {
    try {
      console.log('====================================');
      console.log('passed Url ', url);
      console.log('====================================');
      const route = url.replace('app://', ''); // Extract route
      const parts = route.split('/');
      if (
        parts.length >= 4 &&
        parts[0] === 'api' &&
        parts[1] === 'videos' &&
        parts[2] === 'user'
      ) {
        const userId = parts[3]; // Extract user ID
        console.log(`Navigating to VideoScreen with user ID: ${userId}`);

        if (navigationRef.current) {
          console.log('✅ Navigation triggered!');
          navigationRef.current.navigate('VideoScreen', {userId});
        } else {
          console.error('❌ Navigation reference is not initialized yet.');
        }
      } else {
        console.error('❌ URL format does not match expected pattern.');
      }
    } catch (error) {
      console.error('❌ Error processing deep link:', error);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Initial" component={Initial} />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="home1" component={home1} />
        <Stack.Screen name="CameraPage" component={CameraScreen} />
        <Stack.Screen name="profile" component={Profile} />
        <Stack.Screen name="Transcribe" component={Transcribe} />
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="LikeScreen" component={LikeScreen} />
        <Stack.Screen name="Filtered" component={Filtered} />
        <Stack.Screen name="Edit" component={Edit} />
        <Stack.Screen name="Trending" component={Trending} />
        <Stack.Screen name="Myvideos" component={Myvideos} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="VideoScreen" component={VideoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

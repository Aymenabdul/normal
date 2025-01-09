import React,{ useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Initial from './src/template/initialScreen';
import LoginScreen from './src/template/LoginScreen';
import SignupScreen from './src/template/SignupScreen';
import HomeScreen from './src/template/HomeScreen';
import home1 from './src/template/home1';
import OnboardingScreen from './src/template/onboarding';
import CameraScreen from './src/template/camera';
import Profile from './src/template/Profile';
import notifee from '@notifee/react-native';
import Transcribe from './src/template/transcribe';
import Account from './src/template/account';
import LikeScreen from './src/template/likedvideo';
import Edit from './src/template/Edit';
import Filtered from './src/template/filterd';
import Trending from './src/template/trending';
import Myvideos from './src/template/myvideos';
const Stack = createNativeStackNavigator();
const App = () => {
  useEffect(() => {
    // Create the notification channel for the video owner when the app starts
    const createNotificationChannel = async () => {
      try {
        console.log('Creating notification channel for the owner...');
        await notifee.createChannel({
          id: 'owner-channel',
          name: 'Owner Notifications',
          importance:4, // High priority for immediate attention
          sound: 'default', // Default sound for notifications
          vibrate: true, // Enable vibration
        });
        console.log('Owner channel created successfully!');
      } catch (error) {
        console.error('Error creating owner notification channel:', error);
      }
    };

    createNotificationChannel();
  }, []);
  return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Initial" component={Initial} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="home1" component={home1} />
          <Stack.Screen name="CameraPage" component={CameraScreen} />
          <Stack.Screen name="profile" component={Profile} />
          <Stack.Screen name="Transcribe" component={Transcribe}/>
          <Stack.Screen name="Account" component={Account}/>
          <Stack.Screen name="LikeScreen" component={LikeScreen}/>
          <Stack.Screen name="Filtered" component={Filtered}/>
          <Stack.Screen name="Edit" component={Edit}/>
          <Stack.Screen name="Trending" component={Trending}/>
          <Stack.Screen name="Myvideos" component={Myvideos}/>
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;

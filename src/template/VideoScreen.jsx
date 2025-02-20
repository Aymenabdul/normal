import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  ImageBackground,
  Alert,
  BackHandler,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import {useRoute, useNavigation} from '@react-navigation/native';
import env from './env';

const VideoScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {userId: deepLinkUserId} = route.params || {};
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storedUserId, setStoredUserId] = useState(null);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Do you want to go back?', [
        {text: 'Cancel', onPress: () => null, style: 'cancel'},
        {text: 'Yes', onPress: () => navigation.goBack()},
      ]);
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, [navigation]);

  useEffect(() => {
    const checkUserLogin = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) {
          console.log('❌ No stored user ID. Redirecting to login.');
          setIsLoggedIn(false);
          setVideoUri(null);
          Alert.alert(
            'Sign In Required',
            'You need to sign in to watch videos.',
            [{text: 'OK', onPress: () => navigation.navigate('LoginScreen')}],
          );
          return;
        }

        setStoredUserId(storedId);
        setIsLoggedIn(true);
        console.log(`✅ Logged-in User ID: ${storedId}`);
        fetchVideo(storedId);
      } catch (error) {
        console.error('❌ Error checking login status:', error);
      }
    };

    const fetchVideo = async id => {
      console.log(`Fetching video for user: ${id}`);
      try {
        const response = await fetch(`${env.baseURL}/api/videos/user/${id}`, {
          headers: {Range: 'bytes=0-999999'},
        });

        if (!response.ok) {
          throw new Error('❌ Failed to fetch video');
        }

        setVideoUri(`${env.baseURL}/api/videos/user/${id}`);
      } catch (error) {
        console.error('Error fetching video:', error);
        setVideoUri(null);
      } finally {
        setLoading(false);
      }
    };

    const checkAppInstalled = async () => {
      const appPackageName = 'com.yourapp.package'; // 🔄 Replace with your actual package name
      const appStoreURL = `https://play.google.com/store/apps/details?id=${appPackageName}`;

      try {
        const canOpen = await Linking.canOpenURL(`market://details?id=${appPackageName}`);
        if (!canOpen) {
          console.log('❌ App not installed. Redirecting to Play Store...');
          Alert.alert(
            'App Not Installed',
            'You need to download the app to watch videos.',
            [
              {text: 'Download App', onPress: () => Linking.openURL(appStoreURL)},
              {text: 'Cancel', style: 'cancel'},
            ],
          );
        }
      } catch (error) {
        console.error('❌ Error checking app installation:', error);
      }
    };

    checkUserLogin();
    checkAppInstalled(); // 🔥 Check if the app is installed

    if (deepLinkUserId) {
      fetchVideo(deepLinkUserId);
    }
  }, [navigation, deepLinkUserId]);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to watch videos.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('./assets/login.jpg')}
      style={styles.container}>
      {videoUri ? (
        <Video
          source={{uri: videoUri}}
          style={styles.video}
          controls={true}
          resizeMode="contain"
          onLoad={() => console.log('✅ Video loaded')}
          onError={e => console.error('❌ Video error:', e)}
          repeat={true}
        />
      ) : (
        <Text style={styles.errorText}>No video available.</Text>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '95%',
    height: '85%',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default VideoScreen;

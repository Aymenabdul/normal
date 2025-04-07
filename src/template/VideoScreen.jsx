import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ActivityIndicator,
  BackHandler,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import axios from 'axios';
import Shares from 'react-native-vector-icons/Entypo';
import Ant from 'react-native-vector-icons/AntDesign';
import Like from 'react-native-vector-icons/Foundation';
import Phone from 'react-native-vector-icons/FontAwesome6';
import Whatsapp from 'react-native-vector-icons/Entypo';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import Share from 'react-native-share';
import {useRoute, useNavigation, useIsFocused} from '@react-navigation/native';
import env from './env';

const VideoScreen = () => {
  const route = useRoute();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const {videoUrl, videoId: routeVideoId} = route.params || {}; // Retrieve videoId from route params
  const [videoUri, setVideoUri] = useState(videoUrl || null); // 🔄 Initialize with videoUrl
  const [loading, setLoading] = useState(!videoUrl); // 🔄 Set loading based on videoUrl
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [email, setEmail] = useState();
  const [phoneNumber, setPhoneNumber] = useState();
  const [userId, setUserId] = useState();
  const [currentVideo, setCurrentVideo] = useState(null);
  const [jobOption, setJobOption] = useState('');
  const [videoId, setVideoId] = useState(routeVideoId || null); // Initialize videoId from route params
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [userName, setUserName] = useState();
  const [isLiked, setIsLiked] = useState({});
  const [storedUserId, setStoredUserId] = useState(null);

  const subtitlesUrl = `${env.baseURL}/api/videos/user/${videoId}/subtitles.srt`;
  const parseTimeToSeconds = timeStr => {
    const [hours, minutes, seconds] = timeStr.split(':');
    const [sec, milli] = seconds.split(',');
    return (
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseInt(sec, 10) +
      parseInt(milli, 10) / 1000
    );
  };
  // Function to check which subtitle is currently active based on video time
  useEffect(() => {
    const activeSubtitle = subtitles.find(
      subtitle =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime,
    );
    setCurrentSubtitle(activeSubtitle ? activeSubtitle.text : '');
  }, [currentTime, subtitles]);
  useEffect(() => {
    if (isFocused) {
      const parseSRT = srtText => {
        const lines = srtText.split('\n');
        const parsedSubtitles = [];
        let i = 0;

        while (i < lines.length) {
          if (lines[i].match(/\d+/)) {
            const startEnd = lines[i + 1].split(' --> ');
            const startTime = parseTimeToSeconds(startEnd[0]);
            const endTime = parseTimeToSeconds(startEnd[1]);
            const text = lines[i + 2];
            parsedSubtitles.push({startTime, endTime, text});
            i += 4;
          } else {
            i++;
          }
        }

        return parsedSubtitles;
      };

      const fetchSubtitles = async () => {
        try {
          const response = await fetch(subtitlesUrl);
          const text = await response.text();
          const parsedSubtitles = parseSRT(text);
          setSubtitles(parsedSubtitles);
        } catch (error) {
          console.error('Error fetching subtitles:', error);
        }
      };

      fetchSubtitles();
    }
  }, [isFocused, subtitlesUrl, videoId]);
  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        const apiJobOption = await AsyncStorage.getItem('jobOption');
        const storedVideoId = await AsyncStorage.getItem('videoId'); // Retrieve videoId from AsyncStorage
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;

        setFirstName(apiFirstName);
        setJobOption(apiJobOption);
        setUserId(parsedUserId);
        setVideoId(routeVideoId || storedVideoId); // Use routeVideoId or fallback to storedVideoId
        fetchLikeStatus(parsedUserId);
        fetchProfilePic(parsedUserId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };
    loadDataFromStorage();
  }, [routeVideoId]);

  const handleLike = async () => {
    if (!videoId || !userId) {
      console.error('Error: videoId or userId is missing.');
      return;
    }

    const newLikedState = !isLiked[videoId];
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (newLikedState) {
        const response = await axios.post(
          `${env.baseURL}/api/videos/${videoId}/like`,
          null,
          {
            params: {userId, firstName},
          },
        );
        if (response.status === 200) {
          setLikeCount(prevCount => prevCount + 1);
          await saveLikeNotification(videoId, firstName);
        }
      }
    } catch (error) {
      console.error(
        'Error toggling like:',
        error.response?.data || error.message,
      );
      setIsLiked(prevState => ({
        ...prevState,
        [videoId]: !newLikedState, // Revert state on error
      }));
    }
  };

  const handleDislike = async () => {
    if (!videoId || !userId) {
      console.error('Error: videoId or userId is missing.');
      return;
    }

    const newLikedState = !isLiked[videoId];
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (!newLikedState) {
        const response = await axios.post(
          `${env.baseURL}/api/videos/${videoId}/dislike`,
          null,
          {
            params: {userId, firstName},
          },
        );
        if (response.status === 200) {
          setLikeCount(prevCount => Math.max(prevCount - 1, 0)); // Ensure count doesn't go below 0
        }
      }
    } catch (error) {
      console.error(
        'Error toggling dislike:',
        error.response?.data || error.message,
      );
      setIsLiked(prevState => ({
        ...prevState,
        [videoId]: !newLikedState, // Revert state on error
      }));
    }
  };

  const saveLikeNotification = async (videoId, firstName) => {
    try {
      const notifications =
        JSON.parse(await AsyncStorage.getItem('likeNotifications')) || [];
      notifications.push({videoId, firstName, timestamp: Date.now()});
      await AsyncStorage.setItem(
        'likeNotifications',
        JSON.stringify(notifications),
      );
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Handle dislike action
  const fetchProfilePic = async userId => {
    try {
      const response = await axios.get(
        `${env.baseURL}/users/user/${userId}/profilepic`,
        {
          responseType: 'arraybuffer',
        },
      );
      if (response.data) {
        const base64Image = `data:image/jpeg;base64,${Buffer.from(
          response.data,
          'binary',
        ).toString('base64')}`;
        setProfileImage(base64Image);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error fetching profile pic:', error);
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  };

  const shareOption = async () => {
    try {
      // Define the thumbnail URL
      const thumbnailUrl =
        'https://wezume.in/uploads/videos/shareThumbnail.jpg';
      const localThumbnailPath = `${RNFS.CachesDirectoryPath}/thumbnail.jpg`;

      // Check if the URL is valid
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new Error(
          `Thumbnail URL is not accessible: ${response.statusText}`,
        );
      }

      // Download the thumbnail locally
      const downloadResult = await RNFS.downloadFile({
        fromUrl: thumbnailUrl,
        toFile: localThumbnailPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        const shareOptions = {
          title: 'Share User Video',
          message: `Check out this video shared by ${firstName}\n\n${env.baseURL}/users/share?target=app://api/videos/user/${videoUri}/${videoId}`,
          url: `file://${localThumbnailPath}`, // Share the local thumbnail image
        };

        await Share.open(shareOptions);
      } else {
        console.error(
          'Failed to download the thumbnail. Status code:',
          downloadResult.statusCode,
        );
        Alert.alert('Error', 'Unable to download the thumbnail for sharing.');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert(
        'Error',
        'An error occurred while preparing the share option.',
      );
    }
  };

  const makeCall = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(err => {
        console.error('Error making call:', err);
        Alert.alert(
          'Error',
          'Call failed. Make sure the app has permission to make calls.',
        );
      });
    } else {
      console.log('No phone number, fetching phone number...'); // Log that we're fetching the phone number
    }
  };
  // Function to send a WhatsApp message
  const sendEmail = () => {
    if (email) {
      const subject = 'Hello from Wezume'; // Customize your email subject
      const body = `Hello, ${userName}, it's nice to connect with you.`; // Customize your email body
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      Linking.openURL(mailtoUrl).catch(err => {
        console.error('Error sending email:', err);
        Alert.alert(
          'Error',
          'Failed to open email client. Make sure an email client is installed and configured on your device.',
        );
      });
    } else {
      Alert.alert('Error', 'Email address is not available.');
    }
  };

  const fetchLikeStatus = async userId => {
    if (!userId) {
      console.error('Error: userId is invalid or undefined.');
      return; // Exit early if userId is not valid
    }
    try {
      const response = await axios.get(
        `${env.baseURL}/api/videos/likes/status`,
        {params: {userId}},
      );
      const likeStatus = response.data;
      setIsLiked(likeStatus);
    } catch (error) {
      console.error(
        'Error fetching like status:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    const fetchPhoneNumber = () => {
      axios
        .get(`${env.baseURL}/api/videos/getOwnerByVideoId/${videoId}`) // Adjust if needed to match your API
        .then(response => {
          if (response.data && response.data.phoneNumber) {
            setPhoneNumber(response.data.phoneNumber);
            setEmail(response.data.email);
            setUserName(response.data.firstName);
          } else {
            Alert.alert(
              'Error',
              'Owner not found or no phone number available.',
            );
          }
          if (response.data && response.data.videoId) {
            setVideoId(response.data.videoId);
          } else {
            console.error('Error', 'No video ID found for this user.');
          }
        })
        .catch(error => {
          console.error('Error fetching owner data:', error); // Log the error
        });
    };

    const fetchLikeCount = async () => {
      if (!videoId) return;
      try {
        const response = await axios.get(
          `${env.baseURL}/api/videos/${videoId}/like-count`,
        );
        setLikeCount(response.data || 0);
      } catch (error) {
        console.error(
          'Error fetching like count:',
          error.response?.data || error.message,
        );
      }
    };
    fetchPhoneNumber();
    fetchLikeCount();
  }, [videoId]); // Trigger only when videoId changes

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
        if (!videoUrl) {
          fetchVideo(storedId);
        }
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
        const canOpen = await Linking.canOpenURL(
          `market://details?id=${appPackageName}`,
        );
        if (!canOpen) {
          console.log('❌ App not installed. Redirecting to Play Store...');
          Alert.alert(
            'App Not Installed',
            'You need to download the app to watch videos.',
            [
              {
                text: 'Download App',
                onPress: () => Linking.openURL(appStoreURL),
              },
              {text: 'Cancel', style: 'cancel'},
            ],
          );
        }
      } catch (error) {
        console.error('❌ Error checking app installation:', error);
      }
    };

    if (!videoUrl) {
      checkUserLogin();
      checkAppInstalled(); // 🔥 Check if the app is installed
    }
  }, [navigation, videoUrl]);

  const close = () => {
    navigation.goBack();
  };

  if (!isLoggedIn && !videoUrl) {
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
          onProgress={({ currentTime }) => setCurrentTime(currentTime)}
          repeat={true}
        />
      ) : (
        <Text style={styles.errorText}>No video available.</Text>
      )}
      <TouchableOpacity onPress={close} style={styles.buttoncls}>
        <Ant name={'leftcircle'} size={24} color={'#ccc'} />
      </TouchableOpacity>
      <View style={styles.buttonheart}>
        <TouchableOpacity
          onPress={() => (isLiked[videoId] ? handleDislike() : handleLike())}>
          <Like
            name={'heart'}
            size={30}
            style={[
              {color: isLiked[videoId] ? 'red' : '#ffffff'}, // Dynamically change color
            ]}
          />
          <Text style={styles.count}>{likeCount}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonshare}>
        <TouchableOpacity onPress={shareOption}>
          <Shares name={'share'} size={30} color={'#ffffff'} />
        </TouchableOpacity>
      </View>
      {(jobOption === 'Employer' || jobOption === 'Investor') && (
        <>
          <View style={styles.buttonmsg}>
            <TouchableOpacity onPress={sendEmail}>
              <Whatsapp name={'email'} size={27} color={'#ffffff'} />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonphone}>
            <TouchableOpacity onPress={makeCall}>
              <Phone name={'phone-volume'} size={22} color={'#ffffff'} />
            </TouchableOpacity>
          </View>
        </>
      )}
      <View style={styles.subtitle}>
        <Text
          style={{
            color: '#ffffff',
            fontSize: 14,
            textAlign: 'center',
            fontWeight: 800,
            bottom: -30,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          {currentSubtitle}
        </Text>
      </View>
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
  userDetails: {
    position: 'absolute',
    top: '78%',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // Ensure it appears above the video
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 10,
  },
  userName: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    elevation: 10,
  },
  buttoncls: {
    color: '#ffffff',
    position: 'absolute',
    top: 15,
    right: '89%',
    fontSize: 24,
    fontWeight: '900',
  },
  buttonheart: {
    position: 'absolute',
    top: '60%',
    right: 32,
    color: '#ffffff',
    fontSize: 30,
    zIndex: 10,
    elevation: 10,
    padding: 10,
  },
  buttonshare: {
    position: 'absolute',
    top: '67%',
    right: 27,
    color: '#ffffff',
    fontSize: 30,
    zIndex: 10,
    elevation: 10,
    padding: 10,
  },
  buttonphone: {
    position: 'absolute',
    top: '73%',
    right: 30,
    color: '#ffffff',
    fontSize: 22,
    zIndex: 10,
    padding: 10,
    elevation: 10,
  },
  buttonmsg: {
    position: 'absolute',
    top: '78%',
    right: 30,
    color: '#ffffff',
    fontSize: 30,
    zIndex: 10,
    elevation: 10,
    padding: 10,
  },
  count: {
    position: 'absolute',
    right: 7,
    color: '#ffffff',
    top: '89%',
    fontWeight: '900',
    zIndex: 10,
    elevation: 10,
  },
  trending1: {
    position: 'absolute',
    right: '45%',
    padding: 28,
    top: 0,
    fontWeight: '900',
  },
  trending: {
    position: 'absolute',
    right: '23%',
    padding: 28,
    top: 0,
    fontWeight: '900',
  },
  line: {
    position: 'absolute',
    right: '43%',
    padding: 28,
    top: 0,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    position: 'absolute',
    right: 80,
    width: 300,
    padding: 10,
    bottom: '26%',
  },
});

export default VideoScreen;

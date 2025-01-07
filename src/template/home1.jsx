import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ImageBackground,
  Alert,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import Header from './header';
import axios from 'axios';
import {Buffer} from 'buffer';
import Video from 'react-native-video';
import Delete from 'react-native-vector-icons/MaterialCommunityIcons';
import Shares from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import notifee from '@notifee/react-native';
import {Filter} from 'bad-words';
import env from './env';

const Home1 = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const [firstName, setFirstName] = useState();
  const [industry, setIndustry] = useState();
  const [userId, setUserId] = useState();
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasVideo, setHasVideo] = useState(false); // Track if video is uploaded
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [videoId, setVideoId] = useState();
  const [transcription, setTranscription] = useState('');
  const [isVideoVisible, setIsVideoVisible] = useState(true);

  useEffect(() => {
    const filter = new Filter(); // Initialize the bad-words filter
    const fetchTranscription = async () => {
      try {
        const response = await axios.get(
          `${env.baseURL}/api/videos/${userId}/transcription`,
        );
        if (response.data.transcription) {
          const fetchedTranscription = response.data.transcription;
          setTranscription(fetchedTranscription);

          // Check for profanity in the transcription
          const cleanText = filter.clean(fetchedTranscription);

          // If profanity is detected (cleanText is different from original transcription), hide or blur the video
          if (cleanText !== fetchedTranscription) {
            console.log('Profanity detected! Hiding or blurring the video.');
            setIsVideoVisible(false); // Hide the video if profanity is detected
          } else {
            console.log('No profanity detected.');
            setIsVideoVisible(true); // Show the video if no profanity is detected
          }
        } else {
        }
      } catch (error) {
        console.error('Error fetching transcription:', error.message);
      }
    };

    fetchTranscription();
  }, [userId]); // Dependency array to trigger the effect when userId changes

  // Function to convert time format to seconds
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
    const backAction = () => {
      if (isFocus) {
        // Optional: Show a confirmation alert before exiting the app
        Alert.alert('Exit App', 'Do you want to go Back?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'Yes', onPress: () => navigation.navigate('HomeScreen')},
        ]);

        // Returning true indicates that we have handled the back press
        return true;
      } else {
        navigation.goBack();
        return true;
      }
    };

    // Add event listener for back press
    BackHandler.addEventListener('hardwareBackPress', backAction);

    // Cleanup the event listener on component unmount
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  });

  // Fetch subtitles when component is mounted
  useEffect(() => {
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
  }, [subtitlesUrl]);

  // Fetch profile image
  const fetchProfilePic = async userId => {
    setLoading(true);
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
        console.error('Profile picture not found in response');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error fetching profile pic:', error);
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  };
  // Fetch user's video
  const fetchVideo = async userId => {
    setLoading(true);
    try {
      const rangeHeader = 'bytes=0-999999';
      const response = await fetch(`${env.baseURL}/api/videos/user/${userId}`, {
        headers: {
          Range: rangeHeader,
        },
        responseType: 'arraybuffer',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      const videoUril = `${env.baseURL}/api/videos/user/${userId}`;
      setVideoUri(videoUril);
      setHasVideo(true); // Set to true if video is available
    } catch (error) {
      Alert('Welcome , you can now start recording the video');
      setHasVideo(false); // Set to false if no video is available
    } finally {
      setLoading(false);
    }
  };

  // Delete video
  const deleteVideo = async userId => {
    Alert.alert(
      'Delete Video', // Title of the alert
      'Are you sure you want to delete this video?', // Message
      [
        {
          text: 'Cancel', // Button label
          style: 'cancel', // Button style
          onPress: () => console.log('Delete cancelled'), // Optional cancel action
        },
        {
          text: 'Delete', // Button label
          style: 'destructive', // Destructive style for the delete button (iOS)
          onPress: async () => {
            // Proceed with the deletion
            try {
              const response = await fetch(
                `${env.baseURL}/api/videos/delete/${userId}`,
                {
                  method: 'DELETE',
                },
              );

              if (!response.ok) {
                throw new Error('Failed to delete video');
              }

              const message = await response.text();
              console.log(message); // "Video deleted successfully for userId: <userId>"
              setHasVideo(false); // Hide the + icon when video is deleted
              setVideoUri(null); // Clear the video URI
            } catch (error) {
              console.error('Error deleting video:', error);
            }
          },
        },
      ],
      {cancelable: false}, // Prevent dismissing by tapping outside the alert
    );
  };

  const subtitlesUrl = `${env.baseURL}/api/videos/${userId}/subtitles.srt`;

  const shareOption = async () => {
    const share = {
      title: 'Share User Video',
      message: `Check out this video shared by ${firstName}`,
      url: videoUri, // Must be a valid URI
    };

    try {
      const shareResponse = await Share.open(share);
      console.log('Share successful:', shareResponse);
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  //Reactions full code................................................................................................................

  const ensureNotificationChannel = async () => {
    const channelId = 'owner-channel';
    await notifee.createChannel({
      id: channelId,
      name: 'Owner Channel',
      importance: 4,
    });
    return channelId;
  };

  useEffect(() => {
    const fetchNotifications = async userId => {
      // Ensure userId is valid
      if (!userId) {
        console.error('User ID is missing');
        return;
      }

      console.log('notification userId ', userId);
      try {
        const response = await axios.get(`${env.baseURL}/api/notifications`, {
          params: {userId},
        });

        const notifications = response.data;

        if (notifications.length > 0) {
          // Display the latest notification
          const latestNotification = notifications[0];

          await notifee.displayNotification({
            title: 'Wezume',
            body: `${latestNotification.likerName} liked your video.`,
            android: {
              channelId: await ensureNotificationChannel(),
              smallIcon: 'ic_launcher', // Replace with your app's small icon
            },
          });

          // Mark notifications as read (optional)
          await axios.post(
            `${env.baseURL}/api/notifications/mark-as-read`,
            notifications.map(n => n.id),
          );
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Run the logic only if userId is valid and hasVideo is true
    if (userId && hasVideo) {
      fetchNotifications(userId); // Call it immediately
      const intervalId = setInterval(() => fetchNotifications(userId), 5000); // Set up interval to call periodically

      // Cleanup interval on component unmount or when hasVideo changes
      return () => clearInterval(intervalId);
    } else if (!hasVideo) {
      console.log('User has no video, skipping notification fetching');
    } else {
      console.error('UserId is undefined or invalid.');
    }
  }, [userId, hasVideo]); // Dependency on userId and hasVideo

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiIndustry = await AsyncStorage.getItem('industry');
        const apiUserId = await AsyncStorage.getItem('userId');
        const apiVideoId = await AsyncStorage.getItem('videoId');

        // Convert userId and videoId from string to integer
        const parsedVideoId = apiVideoId ? parseInt(apiVideoId, 10) : null;

        // Log the retrieved and parsed values
        console.log('Retrieved videoId:', parsedVideoId);

        // Set state with retrieved data
        setFirstName(apiFirstName);
        setIndustry(apiIndustry);
        setUserId(apiUserId); // Set parsed userId in state
        setVideoId(parsedVideoId); // Set parsed videoId in state

        // Call functions to fetch additional data (profile picture, video, etc.)
        fetchProfilePic(apiUserId);
        fetchVideo(apiUserId);

        // Log the videoId after setting it
        console.log('Retrieved videoId from AsyncStorage:', parsedVideoId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  return (
    <View style={styles.container}>
      <View style={{flex: 1}}>
        <Header
          profile={profileImage}
          userName={firstName}
          jobOption={industry}
        />
      </View>
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.imageBackground}>
        <View
          style={{marginTop:'20%'}}></View>
        <View style={{height:'100%',width:'100%', justifyContent: 'center',alignItems:'center'}}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : videoUri && isVideoVisible ? (
            // Show the video if it's visible
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{height:'80%',width:'100%', justifyContent: 'center',alignItems:'center'}}>
              <Video
                source={{uri: videoUri}}
                style={styles.videoPlayer}
                resizeMode="contain"
                controls={true}
                onProgress={e => setCurrentTime(e.currentTime)} // Track current time
              />
              <Text style={styles.subtitle}>{currentSubtitle}</Text>
            </TouchableOpacity>
          ) : !hasVideo ? (
            // Show a message if there is no video to upload
            <Text style={styles.noVideoText}>
              No video available. You need to upload a video.
            </Text>
          ) : (
            // Show a message if the video is hidden due to inappropriate language
            <Text style={styles.noVideoText}>
              Video is hidden due to inappropriate language. You need to delete
              the video and upload again.
            </Text>
          )}
          {/* Conditionally render the + icon */}
          {!hasVideo && (
            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => navigation.navigate('CameraPage', {userId})}>
              <Text style={styles.plusButtonText}>+</Text>
            </TouchableOpacity>
          )}

          {/* Show additional buttons if a video is available */}
          {hasVideo && (
            <View style={styles.btnContainer}>
              <TouchableOpacity
                style={styles.transcriptionButton}
                onPress={shareOption}>
                <Shares
                  name={'share-social-outline'}
                  size={28}
                  style={styles.transcriptionButtonText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteVideo(userId)}>
                <Delete
                  name={'delete-empty-outline'}
                  size={28}
                  style={styles.deleteButtonText}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 15,
    justifyContent: 'center',alignItems:'center',width:'100%',height:'100%',
  },
  container: {
    flex: 1,
    // resizeMode: 'contain',
  },
  videoList: {
    // paddingLeft: 10,
    // paddingTop: 10,
  },
  videoItem: {
    flex: 1,
    marginTop:'10%',
  },
  videoPlayer: {
    height:'110%',
    borderRadius: 10,
    width:'90%',
    marginTop:'10%',
  },
  transcriptionButton: {
    marginTop: -15,
    backgroundColor: '#2e80d8',
    padding: 10,
    borderRadius: 50,
    marginHorizontal: 10,
    elevation: 10,
  },
  transcriptionButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  plusButton: {
    position: 'absolute',
    top: '80%',
    right: '10%',
    backgroundColor: '#2e80d8',
    height: 60,
    width: 60,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  plusButtonText: {
    fontSize: 40,
    color: '#fff',
  },
  emptyListText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: '100%',
    color: '#ffffff',
    elevation: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalVideoPlayer: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#2e80d8',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
  },
  transcriptionText: {
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  transcriptionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 18,
  },
  updateButton: {
    backgroundColor: '#2e80d8',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
  },
  btnctnr: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },
  deleteButton: {
    marginTop: -15,
    padding: 10,
    marginHorizontal: 10,
    backgroundColor: '#2e80d8',
    borderRadius: 50,
    elevation: 10,
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  modelbtn: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height:'20%',
  },
  noVideoText: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: '600',
    // marginLeft: '10%',
    color: '#ffffff',
  },
  subtitle: {
    bottom: '30%',
    color: 'white',
    fontSize:22,
    padding: 5,
    textAlign: 'center',
    zIndex:10,
    width:'70%',
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
    bottom: 200,
    right: '5%',
    color: '#ffffff',
    paddingRight: 20,
    fontSize: 30,
  },
  buttonphone: {
    position: 'absolute',
    bottom: 148,
    right: '5%',
    paddingRight: 20,
    color: '#ffffff',
    fontSize: 22,
  },
  buttonmsg: {
    position: 'absolute',
    bottom: 90,
    right: '5%',
    paddingRight: 20,
    color: '#ffffff',
    fontSize: 30,
  },
  count: {
    position: 'absolute',
    right: 20,
    color: '#ffffff',
    padding: 28,
    bottom: 155,
    fontWeight: '900',
  },
});

export default Home1;

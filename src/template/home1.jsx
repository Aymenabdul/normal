import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Header from './header';
import axios from 'axios';
import { Buffer } from 'buffer';
import Video from 'react-native-video';
import Delete from 'react-native-vector-icons/MaterialCommunityIcons';
import Shares from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import notifee, { EventType } from '@notifee/react-native';
import env from './env';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Background notification event:', type, detail);

  if (type === EventType.PRESS) {
    console.log('User pressed the notification:', detail.notification);
    // Handle what happens when the notification is tapped (e.g., navigate to a screen)
  }
});

const Home1 = () => {
  const videoRef = useRef(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [thumbnail, setThumbnail] = useState();
  const [firstName, setFirstName] = useState();
  const [industry, setIndustry] = useState();
  const [userId, setUserId] = useState();
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasVideo, setHasVideo] = useState(false); // Track if video is uploaded
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUri, setAudioUri] = useState(null); // Track audio URI
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [videoId, setVideoId] = useState();
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [videoFetched, setVideoFetched] = useState(false); // Add state to track if video is fetched
  const [analysisDone, setAnalysisDone] = useState(false);
  const subtitlesUrl = `${env.baseURL}/api/videos/${userId}/subtitles.srt`;
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
      const backAction = () => {
        // Optional: Show a confirmation alert before exiting the app
        Alert.alert('Exit App', 'Do you want to exit the app?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          { text: 'Yes', onPress: () => BackHandler.exitApp() },
        ]);

        // Returning true indicates that we have handled the back press
        return true;
      };

      // Add event listener for back press
      BackHandler.addEventListener('hardwareBackPress', backAction);

      // Cleanup the event listener on component unmount
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', backAction);
      };
    }
  }, [isFocused]);

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
            parsedSubtitles.push({ startTime, endTime, text });
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
  }, [isFocused, subtitlesUrl, userId]);

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

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      console.log('⏸️ Video paused');
    }
  }, [videoRef]);

  const deleteVideo = useCallback(
    async id => {
      Alert.alert(
        'Delete Video',
        'Are you sure you want to delete this video?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(
                  `${env.baseURL}/api/videos/delete/${id}`,
                  {
                    method: 'DELETE',
                  },
                );

                if (!response.ok) {
                  throw new Error('Failed to delete video');
                }

                await AsyncStorage.removeItem(`videoUri_${id}`);
                await AsyncStorage.removeItem('videoId'); // Remove videoId from AsyncStorage
                console.log(
                  `🗑️ Removed cached video URI and videoId for user: ${id}`,
                );

                const cachePath = `${RNFS.CachesDirectoryPath}/video_${id}.mp4`;

                const fileExists = await RNFS.exists(cachePath);
                if (fileExists) {
                  await RNFS.unlink(cachePath);
                  console.log(`🗑️ Deleted cached video file: ${cachePath}`);
                }

                setHasVideo(false);
                setVideoUri(null);

                pauseVideo(); // Pause the video before navigating

                navigation.reset({
                  index: 0,
                  routes: [{ name: 'home1' }], // Replace with your actual screen name
                });

                // Reload the page
                navigation.navigate('home1');
              } catch (error) {
                console.error('❌ Error deleting video:', error);
              } finally {
                pauseVideo(); // Pause the video when it's not focused
              }
            },
          },
        ],
        { cancelable: false },
      );
    },
    [navigation, pauseVideo],
  );

  const shareOption = async () => {
    try {
      // Define the thumbnail URL
      const thumbnailUrl = thumbnail;
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
      // Alert.alert(
      //   'Error',
      //   'An error occurred while preparing the share option.',
      // );
    }
  };

  //Reactions full code................................................................................................................

  const ensureNotificationChannel = async () => {
    const channelId = 'owner-channel';
    await notifee.createChannel({
      id: channelId,
      name: 'Owner Notifications',
      importance: 4, // Ensure high importance for popup notifications
      vibration: true, // Enable vibration
    });
    return channelId;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const channelId = await ensureNotificationChannel(); // Ensure the channel exists
        const response = await axios.get(`${env.baseURL}/api/notifications`, {
          params: { userId },
        });

        const notifications = response.data;
        if (notifications.length > 0) {
          // Show notification
          for (const notification of notifications) {
            await notifee.displayNotification({
              title: 'Wezume',
              body: `${notification.likerName} liked your video.`,
              android: {
                channelId, // Use the ensured channel
                smallIcon: 'ic_launcher', // Ensure this icon exists in your project
              },
            });
          }

          // Mark notifications as read
          await axios.post(
            `${env.baseURL}/api/notifications/mark-as-read`,
            notifications.map(n => n.id),
          );
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (isFocused) {
      const interval = setInterval(() => {
        if (navigation.isFocused()) {
          fetchNotifications(); // Call the function without passing userId
        }
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isFocused, navigation, userId]); // Dependency on navigation, userId

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (videoRef.current) {
        videoRef.current.setVolume(0); // Mute video when screen loses focus
        console.log('🔇 Video muted due to navigation');
      }
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (videoRef.current) {
        videoRef.current.setVolume(1); // Unmute video when screen gains focus
        videoRef.current.seek(0); // Seek to the beginning when screen gains focus
        console.log(
          '▶️ Video unmuted and seeked to the beginning due to navigation',
        );
      }
    });

    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    }; // Cleanup when component unmounts
  }, [navigation]);

  const fetchVideo = async userId => {
    setLoading(true);
    try {
      const response = await fetch(`${env.baseURL}/api/videos/user/${userId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch video.', response.status, errorText);
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      const data = await response.json();
      const video = data.videoUrl;
      const videoId = data.id;
      const thumb = data.tumbnail;
      const audio = data.audiourl;

      setAudioUri(audio);
      setThumbnail(thumb);
      setVideoUri(video);

      // 🔍 Profanity check
      const videoResponse = await fetch(`${env.baseURL}/api/videos/check-profane`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: video }),
      });

      if (videoResponse.status === 403) {
        Alert.alert('Video unavailable', 'Inappropriate content.', [
          {
            text: 'Delete',
            onPress: () => {
              deleteVideo(userId);
              setHasVideo(false);
              setIsVideoVisible(false);
            },
            style: 'destructive',
          },
        ]);
      } else {
        setHasVideo(true);
        setIsVideoVisible(true);
      }

      // 🎧 Audio analysis
      if (audio && audio.startsWith('https') && videoId) {
        const analyzeResponse = await fetch(
          `${env.baseURL}/api/audio/analyze?userId=${userId}&videoId=${videoId}&filePath=${encodeURIComponent(audio)}`
        );
        if (!analyzeResponse.ok) throw new Error('Audio analysis failed');
        const analysisResult = await analyzeResponse.json();
        console.log('Audio analysis result:', analysisResult);
      }

      // 🧠 Facial score analysis
      if (videoId && video.startsWith('https')) {
        const facialScoreResponse = await fetch(
          `${env.baseURL}/api/facial-score?videoId=${videoId}&url=${encodeURIComponent(video)}`
        );

        if (facialScoreResponse.ok) {
          const facialScore = await facialScoreResponse.json();
          console.log('Facial Score:', facialScore);
          // Optional: setFacialScore(facialScore);
        } else {
          console.warn('Facial score fetch failed.');
        }
      }

    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadDataFromStorage = async () => {
    try {
      const apiFirstName = await AsyncStorage.getItem('firstName');
      const apiIndustry = await AsyncStorage.getItem('industry');
      const apiUserId = await AsyncStorage.getItem('userId');
      const apiJobOption = await AsyncStorage.getItem('jobOption');
      const apiVideoId = await AsyncStorage.getItem('videoId');
      const parsedVideoId = apiVideoId ? parseInt(apiVideoId, 10) : null;
      console.log('Logged-in user details:', {
        userId: apiUserId,
        jobOption: apiJobOption,
        firstName: apiFirstName,
      });
      setFirstName(apiFirstName);
      setIndustry(apiIndustry);
      setUserId(apiUserId);
      setVideoId(parsedVideoId);

      fetchVideo(apiUserId);
      fetchProfilePic(apiUserId);
    } catch (error) {
      console.error('Error loading user data from AsyncStorage', error);
    }
  };

  useEffect(() => {
    if (isFocused && !videoFetched) {
      loadDataFromStorage();
    }
  }, [isFocused]); // ✅ Clean and no unwanted re-runs

  useEffect(() => {
    const sendHeartbeat = () => {
      axios.post(`${env.baseURL}/api/heartbeat`, { userId })
        .then(() => console.log('Heartbeat sent'))
        .catch(err => console.error('Heartbeat failed', err));
    };

    sendHeartbeat(); // send one immediately on mount

    const interval = setInterval(sendHeartbeat, 60 * 1000); // every 5 mins

    return () => clearInterval(interval); // cleanup on unmount
  }, [userId]); // include userId as dependency


  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Header
          profile={profileImage}
          userName={firstName}
          jobOption={industry}
        />
      </View>
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.imageBackground}>
        <View style={{ marginTop: '20%' }}></View>
        <View
          style={{
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : isVideoVisible && videoUri ? (
            // Show the video if it's visible and there's a video URL
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.videoPlayer}
                  resizeMode="contain"
                  automaticallyWaitsToMinimizeStalling={false}
                  controls={true}
                  onProgress={e => setCurrentTime(e.currentTime)}
                />
                {currentSubtitle !== '' && (
                  <Text style={styles.subtitle}>{currentSubtitle}</Text>
                )}
              </View>
          ) : !hasVideo &&
            (isNaN(videoId) || videoId === undefined || videoId === null) ? (
            // Show a message if no video is available1
            <>
              <Text style={styles.noVideoText1}>
                You haven’t uploaded your Profile Video yet. {'\n\n'}
              </Text>
              <Text style={styles.noVideoText}>
                Instructions for Recording Your Video: {'\n'}• Hold your mobile
                in portrait mode. {'\n'}• Ensure your video is at least 30
                seconds long. {'\n'}• Review your transcription before
                uploading. {'\n'}• Do not switch to another screen until the
                upload is complete.
              </Text>
              {/* Conditionally render the + icon */}
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => navigation.navigate('CameraPage', { userId })}>
                <Text style={styles.plusButtonText}>+</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Show a message if the video is hidden due to profanity
            <Text style={styles.noVideoText}></Text>
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
                onPress={() => !isDisabled && deleteVideo(userId)}
                disabled={isDisabled}>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
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
    marginTop: '10%',
  },
  videoPlayer: {
    height: '110%',
    borderRadius: 10,
    width: '90%',
    marginTop: '10%',
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
    height: '20%',
  },
  noVideoText: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    marginLeft: '5%',
    color: '#ffffff',
  },
  noVideoText1: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    bottom: '25%',
    color: 'white',
    fontSize: 14,
    padding: 5,
    textAlign: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '89%',
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
  videoContainer: {
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 10, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: '#000',
    width: '87%',
    height: '80%',
    position: 'relative',
  },

  videoPlayer: {
    width: '100%',
    height: '100%',
  },

  subtitle: {
    position: 'absolute',
    bottom:'13%',
    left: 0,
    right: 0,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 16,
    zIndex: 999,
  },
});

export default Home1;

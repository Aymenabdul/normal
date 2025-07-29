import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Linking,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  BackHandler,
  Dimensions,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Buffer } from 'buffer';
import Video from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import Ant from 'react-native-vector-icons/AntDesign';
import Shares from 'react-native-vector-icons/Entypo';
import Like from 'react-native-vector-icons/Foundation';
import Score from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share'; // Import the share module
import RNFS from 'react-native-fs';
import Phone from 'react-native-vector-icons/FontAwesome6';
import Whatsapp from 'react-native-vector-icons/Entypo';
import env from './env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const windowHeight = Dimensions.get('screen').height;
const FilterSwipe = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [videourl, setVideoUrl] = useState([]); // Array of video objects
  const [hasVideo, setHasVideo] = useState(null);
  const [userId, setUserId] = useState();
  const [firstName, setFirstName] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState({});
  const [videoId, setVideoId] = useState(null);
  const [jobOption, setJobOption] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [totalScore,setTotalScore] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [selectedVideoUri, setSelectedVideoUri] = useState('');
  const isFocused = useIsFocused();
  const [Index, setSelectedIndex] = useState(null);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(true); // State to manage video loading

  const route = useRoute();
  const selectedVideoId = route?.params?.videoId ?? '';
  const selectedIndex = route?.params?.index ?? '';
  const filteredVideos = route?.params?.filteredVideos ?? [];
  const isFiltered = route?.params?.isFiltered ?? false;
  useEffect(() => {
    if (selectedVideoId) {
      setVideoId(selectedVideoId);
      setSelectedIndex(selectedIndex);
      setCurrentVideo(selectedVideoId);
    }
  }, [selectedVideoId, selectedIndex]);

  const fetchLikeStatus = async userId => {
    if (!userId) {
      console.error('Error: userId is invalid or undefined.');
      return; // Exit early if userId is not valid
    }
    try {
      const response = await axios.get(
        `${env.baseURL}/api/videos/likes/status?userId=${userId}`,
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

  const videoRefs = useRef([]); // Array to hold references to video players
  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        const jobOption = await AsyncStorage.getItem('jobOption');
        // const apiVideoId = await AsyncStorage.getItem('videoId');
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;
        // setVideoId(apiVideoId);
        setFirstName(apiFirstName);
        setJobOption(jobOption);
        setUserId(parsedUserId);
        fetchLikeStatus(parsedUserId);
        fetchProfilePic(parsedUserId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []);
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Do you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'Yes', onPress: () => navigation.goBack() },
      ]);
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, [navigation]);
  useEffect(() => {
    const loadVideos = () => {
      try {
        setLoading(true);
        let videoData = [];

        if (isFiltered && Array.isArray(filteredVideos) && filteredVideos.length > 0) {
          videoData = [...filteredVideos];

          // Move selected video to top
          if (selectedIndex !== '') {
            const index = parseInt(selectedIndex, 10);
            if (index >= 0 && index < videoData.length) {
              const [selectedVideo] = videoData.splice(index, 1);
              videoData.unshift(selectedVideo);
            }
          }

          const newVideos = videoData.map(video => {
            const base64Image = video.profilePic
              ? `data:image/jpeg;base64,${video.profilePic}`
              : video.profileImage || null;

            return {
              id: video.id,
              userId: video.userId,
              uri: video.videoUrl || video.uri,
              firstName: video.firstName,
              profileImage: base64Image,
              phoneNumber: video.phoneNumber,
              email: video.email,
              thumbnail: video.thumbnail || null,
            };
          });

          setVideoUrl(newVideos);
          setVideoId(newVideos[0]?.id || null);
          setHasVideo(true);
        } else {
          console.warn('⚠️ No filtered videos passed. Expected fallback here.');
          setHasVideo(false);
        }
      } catch (error) {
        console.error('❌ Error loading videos from params:', error);
        setHasVideo(false);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [filteredVideos, isFiltered, selectedIndex]);


  const handleLike = async () => {
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
            params: { userId, firstName },
          },
        );
        if (response.status === 200) {
          setLikeCount(prevCount => prevCount + 1);
          await saveLikeNotification(videoId, firstName);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert('You have already liked this video.');
      } else {
        console.error('Error toggling like:', error);
      }
    }
  };
  const saveLikeNotification = async (videoId, firstName) => {
    try {
      const notifications =
        JSON.parse(await AsyncStorage.getItem('likeNotifications')) || [];
      notifications.push({ videoId, firstName, timestamp: Date.now() });
      await AsyncStorage.setItem(
        'likeNotifications',
        JSON.stringify(notifications),
      );
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Handle dislike action
  const handleDislike = async () => {
    const newLikedState = !isLiked[videoId];
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (!newLikedState) {
        await axios.post(`${env.baseURL}/api/videos/${videoId}/dislike`, null, {
          params: { userId, firstName },
        });
        setLikeCount(prevCount => prevCount - 1);
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };
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

  const makeCall = item => {
    if (item.phoneNumber) {
      Linking.openURL(`tel:${item.phoneNumber}`).catch(err => {
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
  const sendEmail = item => {
    if (item.email) {
      const subject = 'Hello from Wezume'; // Customize your email subject
      const body = `Hello, ${item.firstName}, it's nice to connect with you.`; // Customize your email body
      const mailtoUrl = `mailto:${item.email}?subject=${encodeURIComponent(
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

  const closeModal = () => {
    navigation.goBack();
  };
  const shareOption = async () => {
    try {
      // Use the thumbnail of the current video
      const thumbnailUrl = currentVideo?.thumbnail;
      if (!thumbnailUrl) {
        Alert.alert('Error', 'Thumbnail is not available for sharing.');
        console.warn('Thumbnail is missing for the current video:', currentVideo);
        return;
      }

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
          message: `Check out this video shared by ${firstName}\n\n${env.baseURL}/users/share?target=app://api/videos/user/${currentVideo.uri}/${videoId}`,
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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const video = viewableItems[0].item;
      const videoId = video?.id;
      if (!videoId) {
        console.error('❌ Error: videoId is null or undefined');
        return;
      }

      setIsVideoLoading(true); // Show loader when video changes
      setCurrentVideo(video);
      setSelectedVideoUri(video.uri);
      setVideoId(videoId); // Set the videoId based on the current video

      const fetchLikeCount = async () => {
        try {
          const response = await axios.get(
            `${env.baseURL}/api/videos/${videoId}/like-count`,
          );
          setLikeCount(response.data); // Update like count for the focused video
        } catch (error) {
          console.error('Error fetching like count:', error);
        }
      };

      fetchLikeCount(); // Fetch like count for the focused video

      // Pause all videos except the focused one
      if (videoRefs.current) {
        videoRefs.current.forEach((ref, index) => {
          if (ref && ref !== videoRefs.current[viewableItems[0].index]) {
            ref.pause();
          }
        });
      }

      const activeSubtitle = subtitles.find(
        subtitle =>
          currentTime >= subtitle.startTime && currentTime <= subtitle.endTime,
      );
      setCurrentSubtitle(activeSubtitle ? activeSubtitle.text : '');

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

      const parseSRT = srtText => {
        const lines = srtText.split('\n');
        const parsedSubtitles = [];
        let i = 0;

        while (i < lines.length) {
          if (lines[i].match(/^\d+$/)) {
            const startEnd = lines[i + 1].split(' --> ');
            const startTime = parseTimeToSeconds(startEnd[0]);
            const endTime = parseTimeToSeconds(startEnd[1]);
            let text = '';
            i += 2;
            while (i < lines.length && lines[i].trim() !== '') {
              text += lines[i] + '\n';
              i++;
            }
            parsedSubtitles.push({ startTime, endTime, text: text.trim() });
          } else {
            i++;
          }
        }
        return parsedSubtitles;
      };

      const fetchSubtitles = async () => {
        try {
          const subtitlesUrl = `${env.baseURL}/api/videos/user/${videoId}/subtitles.srt`;
          const response = await fetch(subtitlesUrl);
          const text = await response.text();
          const parsedSubtitles = parseSRT(text);
          setSubtitles(parsedSubtitles);
        } catch (error) {
          console.error('Error fetching subtitles:', error);
        }
      };

      const fetchScore = async videoId => {
      try {
        const response = await axios.get(
          `https://app.wezume.in/api/totalscore/${videoId}`,
        );
        console.log(response.data);
        setTotalScore(response.data.totalScore);
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScore(videoId); // Fetch score for the focused video

      fetchSubtitles();
    }
  }).current;

  return (
    <View style={styles.container}>
      <View style={styles.modalContainer}>
        <FlatList
          data={videourl}
          keyExtractor={item => item.id.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={windowHeight}
          scrollEnabled
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }} // Trigger when 80% visible
          getItemLayout={(data, index) => ({
            length: windowHeight,
            offset: windowHeight * index,
            index,
          })}
          initialNumToRender={1} // Load one video at a time
          maxToRenderPerBatch={1} // Render one video at a time
          windowSize={1} // Render only one video at a time
          renderItem={({ item, index }) => (
            <View style={[styles.modalContent, { height: windowHeight }]}>
              <View style={styles.userDetails}>
                {item.profileImage && (
                  <Image
                    source={{ uri: item.profileImage }}
                    style={styles.profileImage}
                  />
                )}
                <Text style={styles.userName}>{item.firstName}</Text>
              </View>

              {/* Video Player */}
              <View style={styles.fullScreen}>
                {isVideoLoading && (
                  <ActivityIndicator
                    size="large"
                    color="#ffffff"
                    style={styles.loader}
                  />
                )}
                <Video
                  ref={ref => (videoRefs.current[index] = ref)} // Store reference to video player
                  source={{ uri: item.uri }}
                  style={styles.fullScreenVideo}
                  controls={true}
                  automaticallyWaitsToMinimizeStalling={false}
                  resizeMode="cover"
                  paused={!isFocused || currentVideo?.id !== item.id}
                  onLoadStart={() => setIsVideoLoading(true)} // Show loader when video starts loading
                  onLoad={() => setIsVideoLoading(false)} // Hide loader when video is loaded
                  onError={error =>
                    console.error('Video playback error:', error)
                  }
                  onProgress={({ currentTime }) => {
                    setCurrentTime(currentTime);
                    const activeSubtitle = subtitles.find(
                      subtitle =>
                        currentTime >= subtitle.startTime &&
                        currentTime <= subtitle.endTime,
                    );
                    setCurrentSubtitle(
                      activeSubtitle ? activeSubtitle.text : '',
                    );
                  }}
                  onEndReachedThreshold={0.1} // Load more videos when 10% of the list is scrolled
                  ListFooterComponent={
                    loading && <Text>Loading more videos...</Text>
                  }
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate('Trending')}
                  style={styles.trending1}>
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    #Trending
                  </Text>
                </TouchableOpacity>
                <Text style={styles.line}>|</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('LikeScreen')}
                  style={styles.trending}>
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    Liked Video
                  </Text>
                </TouchableOpacity>
                <View style={styles.buttoncls}>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.buttoncls}>
                    <Ant name={'leftcircle'} size={24} color={'#ccc'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonheart}>
                  <TouchableOpacity
                    onPress={() =>
                      isLiked[videoId] ? handleDislike() : handleLike()
                    }>
                    <Like
                      name={'heart'}
                      size={30}
                      style={[
                        { color: isLiked[videoId] ? 'red' : '#ffffff' }, // Dynamically change color
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
                      <TouchableOpacity onPress={() => sendEmail(item)}>
                        <Whatsapp name={'email'} size={27} color={'#ffffff'} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.buttonphone}>
                      <TouchableOpacity onPress={() => makeCall(item)}>
                        <Phone
                          name={'phone-volume'}
                          size={22}
                          color={'#ffffff'}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {(jobOption === 'Employer' || jobOption === 'Investor') && (
                  <>
                    <View style={styles.buttonmsg}>
                      <TouchableOpacity onPress={() => sendEmail(item)}>
                        <Whatsapp name={'email'} size={27} color={'#ffffff'} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.buttonscore}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('ScoringScreen', { videoId: item.id, userId: item.userId })}>
                        <Score name={'speedometer'} size={30} color={'#ffffff'} />
                        <Text style={{ color: '#ffffff', left: 5, fontWeight: '900' }}>{totalScore}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.buttonphone}>
                      <TouchableOpacity onPress={() => makeCall(item)}>
                        <Phone
                          name={'phone-volume'}
                          size={22}
                          color={'#ffffff'}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                <View style={styles.subtitle}>
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 12,
                      textAlign: 'center',
                      fontWeight: 800,
                      bottom: -30,
                      left: 20,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    }}>
                    {currentSubtitle}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  videoItem: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    aspectRatio: 2.27,
  },
  videoPlayer: {
    height: '99%',
    width: '100%',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    width: 'auto',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    height: '94%',
  },
  fullScreen: {
    flex: 1,
    flexDirection: 'row',
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
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
    zIndex: 10,
  },
});

export default FilterSwipe;

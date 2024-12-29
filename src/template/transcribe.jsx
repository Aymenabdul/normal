import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  TextInput,
  ImageBackground,
  Alert,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './header';
import axios from 'axios';
import {Buffer} from 'buffer';
import Video from 'react-native-video';
import Delete from 'react-native-vector-icons/MaterialCommunityIcons';
import Shares from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import Like from 'react-native-vector-icons/Foundation';
import Phone from 'react-native-vector-icons/FontAwesome6';
import Whatsapp from 'react-native-vector-icons/FontAwesome';
import notifee from '@notifee/react-native';
import env from './env';


const Home1 = () => {
  const navigation = useNavigation();
  const route = useRoute();
//   const {firstName, industry, userId} = route.params;
const [ firstName, setFirstName ] = useState();
const [ industry, setIndustry ] = useState();
const [ userId, setUserId ] = useState();
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [newTranscription, setNewTranscription] = useState('');
  const [videos, setVideos] = useState([]);
  const [isTranscriptionModalVisible, setIsTranscriptionModalVisible] =
    useState(false);
  const [hasVideo, setHasVideo] = useState(false); // Track if video is uploaded
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState({});
  const [videoId, setVideoId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);

  useEffect(() => {
    const Asyncstorage = async () => {
      try {
        // const {firstName, industry, userId} = route.params;
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiindustry = await AsyncStorage.getItem('industry');
        const apiUserId = await AsyncStorage.getItem('userId');
        setFirstName(apiFirstName);
        setIndustry(apiindustry);
        setUserId(apiUserId);

        fetchProfilePic(apiUserId);
      fetchVideo(apiUserId);
      } catch (error) {
        console.log('====================================');
        console.log('Error', error);
        console.log('====================================');
      }
    }
    Asyncstorage();
  }, [])

  // useEffect(() => {
  //   if (userId) {
  //     fetchProfilePic(userId);
  //     fetchVideo(userId);
  //   } else {
  //     console.error('No userId found');
  //     setLoading(false);
  //   }
  // }, [userId]);

  // Function to parse SRT subtitle format
  // Function to convert time format to seconds
  const parseTimeToSeconds = timeStr => {
    const [hours, minutes, seconds] = timeStr.split(':');
    const [sec, milli] = seconds.split(',');
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(sec) +
      parseInt(milli) / 1000
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
  const fetchVideo = async (userId) => {
    setLoading(true);
      try {
        const rangeHeader = 'bytes=0-999999';
        const response = await fetch(
          `${env.baseURL}/api/videos/user/${userId}`,{
            headers: {
              'Range': rangeHeader,
            },
            responseType: 'arraybuffer',
          }
        );
        if (!response.ok) throw new Error('Failed to fetch video');
        console.log('====================================');
        console.log("fwtchVideo", response);
        console.log('====================================');
        const videoUril = `${env.baseURL}/api/videos/user/${userId}`;
        setVideoUri(videoUril);
        setHasVideo(true); // Set to true if video is available
      } catch (error) {
        console.log('====================================');
        console.log("fetchVideo ",error);
        console.log('====================================');
        alert('Welcome , you can now start recording the video');
        setHasVideo(false); // Set to false if no video is available
      } finally {
        setLoading(false);
      }
    };

  // Fetch transcription
  const fetchTranscription = async () => {
    console.log('====================================');
    console.log('transcription userId',userId);
    console.log('====================================');
    try {
      const response = await axios.get(
        `${env.baseURL}/api/videos/${userId}/transcription`,
      );
      if (response.data.transcription) {
        setTranscription(response.data.transcription);
        setIsTranscriptionModalVisible(true); // Show modal after fetching
      } else {
        alert('No transcription available for this user.');
      }
    } catch (error) {
      console.error('Error fetching transcription:', error.message);
      alert('Failed to fetch transcription.');
    }
  };

  

  // Update transcription
  const updateTranscription = async (userId, transcription) => {
    try {
      const response = await axios.put(
        `${env.baseURL}/api/videos/${userId}/transcription`,
        {transcription},
      );
      console.log('Update successful:', response.data.message);
      setTranscription(transcription);
      // Close the transcription modal on successful update
      setIsTranscriptionModalVisible(false);
    } catch (error) {
      console.error(
        'Error updating transcription:',
        error.response?.data?.message || error.message,
      );
    }
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

  useEffect(() => {
    const fetchVideoId = async () => {
      try {
        const response = await axios.get(`${env.baseURL}/api/videos/getVideoIdsByUserId/${userId}`);
        if (response.data && response.data.length > 0) {
          setVideoId(response.data[0]); // Assuming the videoId is the first element, adjust as needed
        } else {
          console.log('No video found for this user');
        }
      } catch (err) {
        console.error('Error fetching video data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoId();
  }, [userId]);

  const fetchPhoneNumber = () => {
    axios
      .get(`${env.baseURL}/api/videos/getOwnerByUserId/${userId}`) // Adjust if needed to match your API
      .then(response => {
        console.log('API Response:', response); // Log the entire response

        if (response.data && response.data.phoneNumber) {
          setPhoneNumber(response.data.phoneNumber);
          console.log('Phone number found:', response.data.phoneNumber); // Log the phone number
        } else {
          Alert.alert('Error', 'Owner not found or no phone number available.');
        }

        // If you also want to set the video ID, make sure it comes from the response
        if (response.data && response.data.videoId) {
          console.log('Video ID:', response.data.videoId); // Log the videoId
          // Set the videoId (make sure to define state or variable for it)
          setVideoId(response.data.videoId); // Assuming you have a setVideoId function
        } else {
          Alert.alert('Error', 'No video ID found for this user.');
        }
      })
      .catch(error => {
        console.error('Error fetching owner data:', error); // Log the error
        Alert.alert('Error', 'Failed to fetch owner details.');
      });
  };

  const makeCall = () => {
    if (phoneNumber) {
      console.log('Making call to:', phoneNumber);
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
    fetchPhoneNumber(userId);
  };

  // Function to send a WhatsApp message
  const sendWhatsappMessage = () => {
    console.log('sendWhatsappMessage function called'); // Log when the function is called

    if (phoneNumber) {
      const message = `Hello, ${firstName} it's nice to connect with you.`; // Customize your message
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
        message,
      )}`;

      console.log('Phone number:', phoneNumber); // Log the phone number
      console.log('Message:', message); // Log the message
      console.log('Constructed URL:', url); // Log the URL being used for the WhatsApp message

      Linking.openURL(url).catch(err => {
        console.error('Error sending WhatsApp message:', err);
        Alert.alert(
          'Error',
          'Failed to send message. Make sure WhatsApp is installed and the phone number is correct.',
        );
      });
    } else {
      console.log('No phone number, fetching phone number...'); // Log that we're fetching the phone number
    }
    fetchPhoneNumber(userId);
  };

  const fetchLikeCount = videoId => {
    console.log('Fetching like count for videoId:', videoId); // Check if the videoId is correct
    axios
      .get(`${env.baseURL}/api/videos/${videoId}/like-count`)
      .then(response => {
        console.log('API response:', response.data);
        setLikeCount(response.data); // Update state with the correct count
      })
      .catch(error => {
        console.error('Error fetching like count:', error);
      });
  };

  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await axios.get(
          `${env.baseURL}/api/videos/likes/status`,
          {
            params: {userId},
          },
        );
        const likeStatus = response.data; // Expecting { videoId: true/false }
        setIsLiked(likeStatus); // Set initial like status
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };
    if (userId && videoId) {
      fetchLikeStatus(videoId);  // Fetch like status when userId or videoId is available
      fetchLikeCount(videoId);  // Fetch like count for the specific video
    }
  }, [userId,videoId]);

  const handleLike = async () => {
    const newLikedState = !isLiked[videoId]; // Toggle the like status
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));
  
    try {
      if (newLikedState) {
        // If liked, send like request
        await axios.post(
          `${env.baseURL}/api/videos/${videoId}/like`,
          null,
          {params: {userId}},
        );
        setLikeCount(prevCount => prevCount + 1); // Increment like count
  
        // Trigger notification for video owner (after the like request is successful)
        await triggerOwnerNotification();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Function to trigger notification for the video owner
const triggerOwnerNotification = async () => {
  try {
    console.log('Triggering notification for the video owner...');

    await notifee.displayNotification({
      title: 'wezume',
      body: `Your video has been liked by ${firstName}.`,
      android: {
        channelId: 'owner-channel',  // Assuming 'owner-channel' was created previously
        smallIcon: 'ic_launcher',
        importance: 4,  // HIGH importance for visibility
        vibrate: true,
      },
    });

    console.log('Owner notification triggered.');
  } catch (error) {
    console.log('Error triggering notification for owner:', error);
  }
};
  

  // Handle dislike action
  const handleDislike = async () => {
    const newLikedState = !isLiked[videoId]; // Toggle the dislike status (opposite of like)
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (!newLikedState) {
        // If disliked, send dislike request
        await axios.post(
          `${env.baseURL}/api/videos/${videoId}/dislike`,
          null,
          {params: {userId}},
        );
        setLikeCount(prevCount => prevCount - 1); // Decrement like count (dislike removes like)
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };

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
        <View style={styles.centerContent}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : videoUri ? (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.videoContainer}>
              <Video
                source={{uri: videoUri}}
                style={styles.videoPlayer}
                resizeMode="contain"
                controls={true}
                onProgress={e => setCurrentTime(e.currentTime)} // Track current time
              />
              <Text style={styles.subtitle}>{currentSubtitle}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noVideoText}>
              No video available for this user.
            </Text>
          )}
          {hasVideo && (
            <View style={styles.btnContainer}>
              <TouchableOpacity
                style={styles.transcriptionButton}
                onPress={() => fetchTranscription(userId)}>
                <Text style={styles.transcriptionButtonText}>Check Transcription</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>navigation.navigate('home1')}>
                <Text style={{color:'white'}}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>

      {/* Transcription Modal */}
      <Modal
        visible={isTranscriptionModalVisible}
        animationType="slide"
        transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Transcription</Text>
            <TextInput
              value={newTranscription || transcription}
              onChangeText={setNewTranscription}
              style={styles.input}
              multiline
            />
            <View style={styles.modelbtn}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => updateTranscription(userId, newTranscription)}>
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsTranscriptionModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 13,
  },
  container: {
    flex: 1,
    resizeMode: 'contain',
  },
  videoList: {
    paddingLeft: 10,
    paddingTop: 10,
  },
  videoItem: {
    flex: 1,
    marginBottom: 20,
    marginRight: 10,
  },
  videoName: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
  videoPlayer: {
    marginLeft: 10,
    marginRight: 10,
    height: 700,
    borderRadius: 10,
    elevation: 10,
  },
  transcriptionButton: {
    marginTop: -15,
    backgroundColor: '#2e80d8',
    padding: 10,
    borderRadius:10,
    marginHorizontal: 10,
    elevation: 10,
  },
  transcriptionButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  plusButton: {
    position: 'absolute',
    top: 680,
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
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginTop: 30,
    marginBottom: 20,
  },
  noVideoText: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: '20%',
    color: '#ffffff',
  },
  subtitle: {
    position: 'absolute',
    bottom: 50,
    left: '10%',
    right: '10%',
    color: 'white',
    fontSize: 18,
    padding: 5,
    textAlign: 'center',
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

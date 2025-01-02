import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Linking,
  BackHandler,
} from 'react-native';
import axios from 'axios';
import {Buffer} from 'buffer';
import Video from 'react-native-video';
import Header from './header';
import Ant from 'react-native-vector-icons/AntDesign';
import Shares from 'react-native-vector-icons/Entypo';
import Like from 'react-native-vector-icons/Foundation';
import Phone from 'react-native-vector-icons/FontAwesome6';
import Whatsapp from 'react-native-vector-icons/FontAwesome';
import Share from 'react-native-share'; // Import the share module
import {PermissionsAndroid, Platform} from 'react-native';
import notifee from '@notifee/react-native';
import env from './env';

import AsyncStorage from '@react-native-async-storage/async-storage';

const Filtered = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [videourl, setVideoUrl] = useState([]); // Array of video objects
  const [hasVideo, setHasVideo] = useState(null);
  const [userId, setUserId] = useState();
  const [firstName, setFirstName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState(null);
  // Add separate states for Modal
  const [modalProfileImage, setModalProfileImage] = useState(null);
  const [modalFirstName, setModalFirstName] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState({});
  const [videoId, setVideoId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null); // To store owner's phone number
  const { filteredVideos, isFiltered } = route.params || {};


  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        // Convert userId and videoId from string to integer
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;

        // Log the retrieved and parsed values
        console.log('Retrieved userId:', parsedUserId);
        // Set state with retrieved data
        setFirstName(apiFirstName);
        setUserId(parsedUserId); // Set parsed userId in state
        // Call functions to fetch additional data (profile picture, video, etc.)
        fetchProfilePic(parsedUserId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  const requestCallPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Phone Call Permission',
            message: 'This app needs access to make phone calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Handle setting video URLs when filtered videos are passed
  useEffect(() => {
    if (isFiltered && filteredVideos.length > 0) {
      setVideoUrl(filteredVideos); // Set the filtered videos directly
      setHasVideo(true); // Ensure videos are displayed
    } else {
      setVideoUrl([]); // No filtered videos, clear the state
      setHasVideo(false); // Hide video display
    }
  }, [filteredVideos, isFiltered]); // Dependency on filteredVideos and isFiltered

  // If no filtered videos are passed, fetch all videos and profile picture
  useEffect(() => {
    // Assuming fetchFilteredVideos and fetchProfilePic are defined elsewhere
  const fetchFilteredVideos = async () => {
    try {
      // Logic to fetch all videos if not filtered
      const response = await fetch(`${env.baseURL}/api/videos/user/${Video.userId}`);
      const data = await response.json();
      setVideoUrl(data);
      setHasVideo(data.length > 0);
    } catch (error) {
      console.error("Error fetching all videos:", error);
      setHasVideo(false);
    }
  };
    if (!isFiltered || filteredVideos.length === 0) {
      fetchFilteredVideos(videoId); // Fetch all videos if not filtered
      fetchProfilePic(userId); // Fetch profile pic for user
    }
  }, [isFiltered, filteredVideos, userId,videoId]); // Dependency on isFiltered, filteredVideos, userId

  const fetchPhoneNumber = () => {
    console.log('Fetching phone number for videoId:', videoId); // Log videoId to ensure it's correct
    axios
      .get(`${env.baseURL}/api/videos/getOwnerByVideoId/${videoId}`)
      .then(response => {
        if (response.data && response.data.phoneNumber) {
          setPhoneNumber(response.data.phoneNumber);
          console.log(response.data.phoneNumber);
          console.log('Phone number found:', response.data.phoneNumber); // Log the phone number
        } else {
          Alert.alert('Error', 'Owner not found or no phone number available.');
        }
      })
      .catch(error => {
        console.error('Error fetching owner data:', error); // Log the error
      });
  };

  const makeCall = () => {
    console.log('videoId in makeCall:', videoId); // Log the videoId being passed
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
  };

  // Function to send a WhatsApp message
  const sendWhatsappMessage = () => {
    console.log('sendWhatsappMessage function called'); // Log when the function is called

    if (phoneNumber) {
      const message = `Hello, ${modalFirstName} it's nice to connect with you.`; // Customize your message
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
    fetchPhoneNumber(videoId);
  };

  useEffect(() => {
    const backAction = () => {
      // Optional: Show a confirmation alert before exiting the app
      Alert.alert('Exit App', 'Do you want to exit the app?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => BackHandler.exitApp()},
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
  }, []);

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

  useEffect(() => {
    fetchProfilePic(userId); // Fetch all videos if no filteredVideos are provided
  }, [userId]);

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

  const handleLike = async () => {
    const newLikedState = !isLiked[videoId]; // Toggle the like status
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (newLikedState) {
        // If liked, send like request
        await axios.post(`${env.baseURL}/api/videos/${videoId}/like`, null, {
          params: {userId},
        });
        setLikeCount(prevCount => prevCount + 1); // Increment like count
        // Trigger notification for video owner (after the like request is successful)
        await saveLikeNotification(videoId, firstName);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
  const handleDislike = async () => {
    const newLikedState = !isLiked[videoId]; // Toggle the dislike status (opposite of like)
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (!newLikedState) {
        // If disliked, send dislike request
        await axios.post(`${env.baseURL}/api/videos/${videoId}/dislike`, null, {
          params: {userId},
        });
        setLikeCount(prevCount => prevCount - 1); // Decrement like count (dislike removes like)
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };

  const openModal = async (uri, videoId) => {
    console.log('Video ID:', videoId); // Debugging: Check if videoId is passed correctly
    setVideoId(videoId);
    // Directly use videoId in the function
    try {
      // Fetch user details by videoId
      const response = await axios.get(
        `${env.baseURL}/api/videos/user/${videoId}/details`,
      );

      const {firstName: fetchedFirstName, profileImage: fetchedProfileImage} =
        response.data;

      // Convert profile image to Base64 with the correct MIME type prefix
      const base64Image = `data:image/jpeg;base64,${fetchedProfileImage}`;

      // Set modal-specific states
      setModalFirstName(fetchedFirstName);
      setModalProfileImage(base64Image);
    } catch (error) {
      console.error('Error fetching user details:', error);

      // Reset on error to prevent showing stale data
      setModalFirstName('');
      setModalProfileImage(null);
    } finally {
      // Make sure to use the passed videoId here for fetching like count and status
      fetchLikeCount(videoId);
      fetchLikeStatus(videoId);

      // Set selected video URI and show the modal
      setSelectedVideoUri(uri);
      fetchPhoneNumber(videoId);
      setIsModalVisible(true);
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

  const closeModal = () => {
    // Close the modal
    setPhoneNumber('');
    setIsModalVisible(false);
  };
  const shareOption = async () => {
    const share = {
      title: 'Share User Video',
      message: `Check out this video shared by ${firstName}`,
      url: selectedVideoUri, // Must be a valid URI
    };

    try {
      const shareResponse = await Share.open(share);
      console.log('Share successful:', shareResponse);
    } catch (error) {}
  };
  return (
    <View style={styles.container}>
      <Header profile={profileImage} userName={firstName} />
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.imageBackground}>
        {hasVideo ? (
          // Render videos from filteredVideos
          <FlatList
            data={videourl}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => openModal(item.uri, item.id)} // Pass video URI and ID
                style={styles.videoItem}>
                <Video
                  source={{uri: item.uri}}
                  style={styles.videoPlayer}
                  resizeMode="contain"
                  onError={error =>
                    console.error('Video playback error:', error)
                  }
                />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.videoList}
          />
        ) : (
          <Text style={styles.emptyListText}>No videos available</Text>
        )}
      </ImageBackground>

      {/* Modal for full-screen video */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.userDetails}>
              {modalProfileImage && (
                <Image
                  source={{uri: modalProfileImage}}
                  style={styles.profileImage}
                  onPress={() => navigation.navigate('HomeScreen')}
                />
              )}
              <Text
                style={styles.userName}
                onPress={() => navigation.navigate('HomeScreen')}>
                {modalFirstName}
              </Text>
            </View>
            <View style={styles.fullScreen}>
              <Video
                source={{uri: selectedVideoUri}}
                style={styles.fullScreenVideo}
                controls={true}
                resizeMode="cover"
                onError={error => console.error('Video playback error:', error)}
              />
              <TouchableOpacity onPress={''} style={styles.trending1}>
                <Text style={{color: '#ffffff', fontWeight: '600'}}>
                  #Trending
                </Text>
              </TouchableOpacity>
              <Text style={styles.line}>|</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('LikeScreen')}
                style={styles.trending}>
                <Text style={{color: '#ffffff', fontWeight: '600'}}>
                  Liked Video
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.buttoncls}>
                <Ant name={'arrowleft'} style={styles.buttoncls} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  isLiked[videoId] ? handleDislike() : handleLike()
                }>
                <Like
                  name={'heart'}
                  style={[
                    styles.buttonheart,
                    {color: isLiked[videoId] ? 'red' : '#ffffff'}, // Dynamically change color
                  ]}
                />
                <Text style={styles.count}>{likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareOption}>
                <Shares name={'share'} style={styles.buttonshare} />
              </TouchableOpacity>
              <TouchableOpacity onPress={sendWhatsappMessage}>
                <Whatsapp name={'whatsapp'} style={styles.buttonmsg} />
              </TouchableOpacity>
              <TouchableOpacity onPress={makeCall}>
                <Phone name={'phone-volume'} style={styles.buttonphone} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    margin: 1,
    marginTop: '-8%',
    marginBottom: 5, // Spacing between videos
  },
  videoPlayer: {
    height: 230,
    width: '100%', // Adjust width for a uniform layout
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  videoList: {
    paddingHorizontal: 2, // Padding around the list
    paddingTop: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background for the modal
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  fullScreen: {
    flex: 1,
    flexDirection: 'row',
  },
  userDetails: {
    position: 'absolute',
    top: '85%',
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
    top: '62%',
    right: '5%',
    color: '#ffffff',
    paddingRight: 40,
    fontSize: 30,
    zIndex: 100,
    elevation: 10,
  },
  buttonshare: {
    position: 'absolute',
    top: '69%',
    right: '5%',
    color: '#ffffff',
    paddingRight: 40,
    fontSize: 30,
    zIndex: 100,
    elevation: 10,
  },
  buttonphone: {
    position: 'absolute',
    top: '75%',
    right: '5%',
    paddingRight: 40,
    color: '#ffffff',
    fontSize: 22,
    zIndex: 100,
    elevation: 10,
  },
  buttonmsg: {
    position: 'absolute',
    top: '80%',
    right: '5%',
    paddingRight: 40,
    color: '#ffffff',
    fontSize: 30,
    zIndex: 100,
    elevation: 10,
  },
  count: {
    position: 'absolute',
    right: 0,
    color: '#ffffff',
    padding: 46,
    top: '60%',
    fontWeight: '900',
    zIndex: 100,
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
});

export default Filtered;

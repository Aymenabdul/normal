import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Linking,
  BackHandler,
  Animated,
} from 'react-native';
import axios from 'axios';
import {Buffer} from 'buffer';
import Video from 'react-native-video';
import Header from './header';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ant from 'react-native-vector-icons/AntDesign';
import Shares from 'react-native-vector-icons/Entypo';
import Like from 'react-native-vector-icons/Foundation';
import Phone from 'react-native-vector-icons/FontAwesome6';
import Whatsapp from 'react-native-vector-icons/Entypo';
import Share from 'react-native-share'; // Import the share module
import {PermissionsAndroid, Platform} from 'react-native';
import notifee from '@notifee/react-native';
import env from './env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const windowHeight = Dimensions.get('screen').height;

const HomeScreen = () => {
  const navigation = useNavigation();
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jobOption, setJobOption] = useState('');
  const [email, setEmail] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        const apiJobOption = await AsyncStorage.getItem('jobOption');
        const apiEmail = await AsyncStorage.getItem('email');
        // Convert userId and videoId from string to integer
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;

        // Log the retrieved and parsed values
        console.log('Retrieved userId:', parsedUserId);
        // Set state with retrieved data
        setFirstName(apiFirstName);
        setUserId(parsedUserId); // Set parsed userId in state
        setJobOption(apiJobOption);
        setEmail(apiEmail);
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

  const fetchPhoneNumber = () => {
    console.log('Fetching phone number for videoId:', videoId); // Log videoId to ensure it's correct
    axios
      .get(`${env.baseURL}/api/videos/getOwnerByVideoId/${videoId}`)
      .then(response => {
        if (response.data && response.data.phoneNumber) {
          setPhoneNumber(response.data.phoneNumber);
          setEmail(response.data.email);
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
  const sendEmail = () => {
    console.log('sendEmail function called'); // Log when the function is called

    if (email) {
      const subject = 'Hello from Wezume'; // Customize your email subject
      const body = `Hello, ${modalFirstName}, it's nice to connect with you.`; // Customize your email body
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;

      console.log('Email Address:', email); // Log the email address
      console.log('Email Subject:', subject); // Log the email subject
      console.log('Email Body:', body); // Log the email body
      console.log('Constructed Mailto URL:', mailtoUrl); // Log the constructed mailto URL

      Linking.openURL(mailtoUrl).catch(err => {
        console.error('Error sending email:', err);
        Alert.alert(
          'Error',
          'Failed to open email client. Make sure an email client is installed and configured on your device.',
        );
      });
    } else {
      console.log('No email address provided'); // Log if no email address is available
      Alert.alert('Error', 'Email address is not available.');
    }
  };

  useEffect(() => {
    const backAction = () => {
      // Optional: Show a confirmation alert before exiting the app
      Alert.alert('Exit App', 'Do you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => navigation.goBack()},
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
  }, [navigation]);

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
    const fetchVideos = async () => {
      try {
        // Construct the URL with the userId parameter
        const url = `${env.baseURL}/api/videos/liked?userId=${userId}`;

        // Make the fetch request with the constructed URL
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Failed to fetch videos: ${response.statusText}`);

        // Parse the response
        const videoData = await response.json();
        console.log('Video Data:', videoData); // Log to check the response structure

        // Check if the video data is an array and contains videos
        if (Array.isArray(videoData) && videoData.length > 0) {
          const videoURIs = videoData.map(video => ({
            id: video.id,
            useId: video.userId,
            title: video.title || 'Untitled Video',
            uri: `${env.baseURL}/api/videos/user/${video.userId}`,
          }));
          console.log('Generated URIs:', videoURIs); // Log generated URLs

          // Set the video URLs and update the state
          setVideoUrl(videoURIs);
          setHasVideo(true);
        } else {
          console.warn('No videos available');
          setVideoUrl([]);
          setHasVideo(false);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setHasVideo(false);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
    fetchProfilePic(userId); // Fetch all videos if no filteredVideos are provided
  }, [userId, videoId]);

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
    console.log('Like count videoId ', videoId);
    console.log('like count userId ', userId);
    const newLikedState = !isLiked[videoId]; // Toggle the like status
    setIsLiked(prevState => ({
      ...prevState,
      [videoId]: newLikedState,
    }));

    try {
      if (newLikedState) {
        // If liked, send like request
        const response = await axios.post(
          `${env.baseURL}/api/videos/${videoId}/like`,
          null,
          {
            params: {userId, firstName},
          },
        );

        // If successful, increment like count
        if (response.status === 200) {
          setLikeCount(prevCount => prevCount + 1); // Increment like count
          // Trigger notification for video owner (after the like request is successful)
          await saveLikeNotification(videoId, firstName);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.error('Error: ', error.response.data); // Handle already liked case
        alert('You have already liked this video.');
      } else {
        console.error('Error toggling like:', error);
      }
    }
  };

  // Save like notification in AsyncStorage
  const saveLikeNotification = async (videoId, firstName) => {
    try {
      // Get existing notifications or initialize an empty array
      const notifications =
        JSON.parse(await AsyncStorage.getItem('likeNotifications')) || [];

      // Add the new notification
      notifications.push({videoId, firstName, timestamp: Date.now()});

      // Save updated notifications back to AsyncStorage
      await AsyncStorage.setItem(
        'likeNotifications',
        JSON.stringify(notifications),
      );

      console.log('Notification saved successfully:', {videoId, firstName});
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
          params: {userId, firstName},
        });
        setLikeCount(prevCount => prevCount - 1); // Decrement like count (dislike removes like)
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(
        `${env.baseURL}/api/videos/user/${videoId}/details`,
      );
      // console.log('User details response:', response.data); // Log the user details
      const {firstName: fetchedFirstName, profileImage: fetchedProfileImage} =
        response.data;

      // Convert profile image to Base64 if necessary
      const base64Image = `data:image/jpeg;base64,${fetchedProfileImage}`;

      // Update the modal with the fetched data
      setModalFirstName(fetchedFirstName || 'Default Name');
      setModalProfileImage(base64Image || 'defaultProfileImageUrl');
    } catch (error) {
      console.error('Error fetching user details:', error);

      // Reset to default values if fetching fails
      setModalFirstName('Default Name');
      setModalProfileImage('defaultProfileImageUrl');
      setLikeCount(0); // Reset like count
    }
  };

  const openModal = async (uri, videoId, useId) => {
    console.log('Video ID:', videoId); // Debugging: Check if videoId is passed correctly
    setVideoId(videoId);
    setSelectedUserId(useId);
    // Directly use videoId in the function

    const activeSubtitle = subtitles.find(
      subtitle =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime,
    );
    console.log('Current Time:', currentTime);
    console.log('Matching Subtitle:', activeSubtitle);
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
          parsedSubtitles.push({startTime, endTime, text: text.trim()});
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
        console.log('Fetched Subtitles:', text); // Debug log
        const parsedSubtitles = parseSRT(text);
        console.log('Parsed Subtitles:', parsedSubtitles); // Debug log
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error('Error fetching subtitles:', error);
      }
    };

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
      fetchUserDetails(videoId);
      fetchSubtitles(videoId);
      setIsModalVisible(true);
      console.log('Modal should now be visible');
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
      url: `${env.baseURL}/users/share?target=app://api/videos/user/${selectedUserId}`, // Must be a valid URI
    };

    try {
      const shareResponse = await Share.open(share);
      console.log('Share successful:', shareResponse);
    } catch (error) {}
  };

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      const video = viewableItems[0].item; // Get the first visible video
      const videoId = video?.id; // Ensure videoId is valid
      if (!videoId) {
        console.error('❌ Error: videoId is null or undefined');
        return; // Stop execution if videoId is not valid
      }

      setCurrentVideo(video); // Update current video
      setSelectedVideoUri(video.uri); // Set selected video URI
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
            parsedSubtitles.push({startTime, endTime, text: text.trim()});
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
          console.log('Fetched Subtitles:', text);
          const parsedSubtitles = parseSRT(text);
          console.log('Parsed Subtitles:', parsedSubtitles);
          setSubtitles(parsedSubtitles);
        } catch (error) {
          console.error('Error fetching subtitles:', error);
        }
      };
      const fetchPhoneNumber = () => {
        axios
          .get(`${env.baseURL}/api/videos/getOwnerByVideoId/${videoId}`)
          .then(response => {
            if (response.data && response.data.phoneNumber) {
              setPhoneNumber(response.data.phoneNumber);
              setEmail(response.data.email);
              console.log(response.data.phoneNumber);
              console.log('Phone number found:', response.data.phoneNumber); // Log the phone number
            } else {
              Alert.alert(
                'Error',
                'Owner not found or no phone number available.',
              );
            }
          })
          .catch(error => {
            console.error('Error fetching owner data:', error); // Log the error
          });
      };
      const fetchLikeStatus = async () => {
        try {
          const response = await axios.get(
            `${env.baseURL}/api/videos/likes/status`,
            {
              params: {userId},
            },
          );
          const likeStatus = response.data;
          setIsLiked(likeStatus);
        } catch (error) {
          console.error('Error fetching like status:', error);
        }
      };
      const fetchLikeCount = () => {
        console.log('Fetching like count for videoId:', videoId);
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
      const fetchUserDetails = async () => {
        try {
          const response = await axios.get(
            `${env.baseURL}/api/videos/user/${videoId}/details`,
          );
          // console.log('User details response:', response.data); // Log the user details
          const {
            firstName: fetchedFirstName,
            profileImage: fetchedProfileImage,
          } = response.data;

          // Convert profile image to Base64 if necessary
          const base64Image = `data:image/jpeg;base64,${fetchedProfileImage}`;

          // Update the modal with the fetched data
          setModalFirstName(fetchedFirstName);
          setModalProfileImage(base64Image);
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      };
      // Fetch user details, like count, and like status
      fetchUserDetails(videoId);
      fetchLikeCount(videoId);
      fetchLikeStatus(videoId);
      fetchPhoneNumber(videoId);
      fetchSubtitles(videoId);
    }
  }).current;

  return (
    <View style={styles.container}>
      <Header profile={profileImage} userName={firstName} />
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.imageBackground}>
        <View style={{height: '0.3%'}}></View>
        <FlatList
          data={videourl}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => openModal(item.uri, item.id, item.useId)} // Pass video URI and ID
              style={styles.videoItem}>
              <Video
                source={{uri: item.uri}}
                style={styles.videoPlayer}
                muted={true}
                resizeMode="contain"
                onError={error => console.error('Video playback error:', error)}
              />
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          numColumns={4}
          contentContainerStyle={styles.videoList}
          columnWrapperStyle={styles.columnWrapper}
        />
      </ImageBackground>

       {/* Modal for full-screen video */}
       <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <FlatList
            data={videourl}
            keyExtractor={item => item.id.toString()}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEnabled
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{itemVisiblePercentThreshold: 50}} // Trigger when 50% visible
            getItemLayout={(data, index) => ({
              length: windowHeight,
              offset: windowHeight * index,
              index,
            })}
            renderItem={({item}) => (
              <View style={[styles.modalContent, {height: windowHeight}]}>
                {/* User Details Section */}
                <View style={styles.userDetails}>
                  {item.profileImage && (
                    <Image
                      source={{uri: item.profileImage}}
                      style={styles.profileImage}
                    />
                  )}
                  <Text style={styles.userName}>{item.firstName}</Text>
                </View>

                {/* Video Player */}
                <View style={styles.fullScreen}>
                  <Video
                    source={{uri: item.uri}}
                    style={styles.fullScreenVideo}
                    controls={true}
                    resizeMode="cover"
                    onError={error =>
                      console.error('Video playback error:', error)
                    }
                    onProgress={({currentTime}) => {
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
                  />
                  <View style={styles.userDetails}>
                    {modalProfileImage && (
                      <Image
                        source={{uri: modalProfileImage}}
                        style={styles.profileImage}
                      />
                    )}
                    <Text style={styles.userName}>{modalFirstName}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Trending')}
                    style={styles.trending1}>
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
                  <View style={styles.buttoncls}>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.buttoncls}>
                      <Ant name={'arrowleft'} size={30} color={'#ffffff'} />
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
                          {color: isLiked[videoId] ? 'red' : '#ffffff'}, // Dynamically change color
                        ]}
                      />
                      <Text style={styles.count}>{likeCount}</Text>
                    </TouchableOpacity>
                  </View>
                      <View style={styles.buttonmsg}>
                        <TouchableOpacity onPress={sendEmail}>
                          <Whatsapp
                            name={'email'}
                            size={27}
                            color={'#ffffff'}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.buttonphone}>
                        <TouchableOpacity onPress={makeCall}>
                          <Phone
                            name={'phone-volume'}
                            size={22}
                            color={'#ffffff'}
                          />
                        </TouchableOpacity>
                      </View>
                  <View style={styles.buttonshare}>
                    <TouchableOpacity onPress={shareOption}>
                      <Shares name={'share'} size={30} color={'#ffffff'} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.subtitle}>
                    <Text
                      style={{
                        color: '#ffffff',
                        fontSize: 12,
                        textAlign: 'center',
                        fontWeight: 800,
                        bottom: -30,
                        left: 20,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      }}>
                      {currentSubtitle}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
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
    // marginTop: '-16.5%',
    // marginBottom: '4%',
    // zIndex: 10,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    aspectRatio: 2.27,
  },
  videoPlayer: {
    height: '99%',
    width: '100%', // Adjust width for a uniform layout
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  videoList: {
    marginTop: 1,
    // paddingHorizontal: 2, // Padding around the list
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
    fontSize: 24,
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
    right: 50,
    width: 300,
    padding: 10,
    bottom: '26%',
  },
});

export default HomeScreen;

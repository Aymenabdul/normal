import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Alert,
  BackHandler,
  Image,
  Text,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { Buffer } from 'buffer';
import Video from 'react-native-video';
import Header from './header';
import { useNavigation } from '@react-navigation/native';
import { PermissionsAndroid, Platform } from 'react-native';
import env from './env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [videourl, setVideoUrl] = useState([]); // Array of video objects
  const [hasVideo, setHasVideo] = useState(null);
  const [userId, setUserId] = useState();
  const [firstName, setFirstName] = useState('');
  // const [videoId, setVideoId] = useState(null);
  const [jobOption, setJobOption] = useState();
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(null);
  const [loadingThumbnails, setLoadingThumbnails] = useState(true);
  const [fetching, setFetching] = useState(false); // Add fetching state
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisibleVideoIndex(viewableItems[0].index);
    }
  }, []);

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

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        // const apiVideoId = await AsyncStorage.getItem('videoId');
        const apiJobOption = await AsyncStorage.getItem('jobOption');
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;
        console.log('Logged-in user details:', {
          userId: parsedUserId,
          firstName: apiFirstName,
          jobOption: apiJobOption,
        });
        setFirstName(apiFirstName);
        // setVideoId(apiVideoId);
        setJobOption(apiJobOption);
        setUserId(parsedUserId);
        fetchProfilePic(parsedUserId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('wezume', 'Do you want to go back', [
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
    const fetchVideos = async () => {
      if (fetching) return; // Prevent multiple fetch calls
      setFetching(true);
      console.log('Fetching videos or loading from cache...');

      try {
        setLoading(true);

        // Check cache first
        const cachedVideos = await AsyncStorage.getItem('cachedVideos');
        if (cachedVideos) {
          console.log('Loading videos from cache');
          const parsedVideos = JSON.parse(cachedVideos);
          setVideoUrl(parsedVideos);
          setHasVideo(parsedVideos.length > 0);
          return;
        }

        // If no cache found, call API
        console.log('No cache found, fetching from API...');
        const response = await fetch(`${env.baseURL}/api/videos/videos`);
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.statusText}`);
        }
        const videoData = await response.json();

        if (!Array.isArray(videoData) || videoData.length === 0) {
          console.warn('No videos available');
          setVideoUrl([]);
          setHasVideo(false);
          return;
        }

        const videoURIs = [];
        for (let index = 0; index < videoData.length; index++) {
          const video = videoData[index];
          console.log(`Processing video ${index + 1}/${videoData.length}`);
          if (!video.videoUrl) {
            console.warn(`Video at index ${index} has no URL`);
            continue;
          }
          videoURIs.push({
            Id: video.id,
            uri: video.videoUrl,
            thumbnail: video.thumbnail,
          });
          setVideoUrl([...videoURIs]); // Update state progressively
          if (index === 0) {
            setLoadingThumbnails(false);
          }
        }

        setVideoUrl(videoURIs); // Final full update
        setHasVideo(true);

        // Save to cache
        await AsyncStorage.setItem('cachedVideos', JSON.stringify(videoURIs));
        console.log('Videos cached successfully');
      } catch (error) {
        console.error('Error fetching videos:', error);
        setHasVideo(false);
      } finally {
        setLoading(false);
        setLoadingThumbnails(false);
        setFetching(false);
      }
    };

    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // you don't need to add 'fetching' into dependencies

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
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Header profile={profileImage} userName={firstName} />
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.imageBackground}>
        {loadingThumbnails ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <FlatList
            data={videourl} // Exclude video with Id 32
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  console.log('VideoId', item.Id, 'Index', index);
                  navigation.navigate('HomeSwipe', {
                    videoId: item.Id,
                    index: index,
                  });
                }}
                style={[styles.videoItem]}>
                {item.thumbnail ? ( // Using the thumbnail property here
                  <ImageBackground
                    source={{ uri: item.thumbnail }}
                    style={styles.videoPlayer}
                    resizeMode="contain">
                    {visibleVideoIndex === index && (
                      <Video
                        source={{ uri: item.thumbnail }}
                        paused={false}
                        style={styles.videoPlayer}
                        resizeMode="contain"
                        muted={true}
                        onError={error =>
                          console.error('Video playback error:', error)
                        }
                      />
                    )}
                  </ImageBackground>
                ) : (
                  <View style={styles.videoPlayer}>
                    <Text>Thumbnail not available</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            numColumns={4}
            contentContainerStyle={styles.videoList}
            columnWrapperStyle={styles.columnWrapper}
            initialNumToRender={2}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
          />
        )}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  reactions: {
    flexDirection: 'row',
  },
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
  videoList: {
    marginTop: 1,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'gray',
  },
});

export default HomeScreen;

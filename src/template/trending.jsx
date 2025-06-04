import React, {useState, useEffect, useRef, useCallback} from 'react';
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
import {Buffer} from 'buffer';
import Video from 'react-native-video';
import Header from './header';
import {useNavigation} from '@react-navigation/native';
import {PermissionsAndroid, Platform} from 'react-native';
import env from './env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyVideos = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [videourl, setVideoUrl] = useState([]); // Array of video objects
  const [hasVideo, setHasVideo] = useState(null);
  const [userId, setUserId] = useState();
  const [firstName, setFirstName] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(null);
  const [loadingThumbnails, setLoadingThumbnails] = useState(true);
  const [fetching, setFetching] = useState(false); // Add fetching state
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const onViewableItemsChanged = useCallback(({viewableItems}) => {
    if (viewableItems.length > 0) {
      setVisibleVideoIndex(viewableItems[0].index);
    }
  }, []);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        const apiVideoId = await AsyncStorage.getItem('videoId');
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;
        setFirstName(apiFirstName);
        setVideoId(apiVideoId);
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
      Alert.alert('wezume', 'Do you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
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
    const fetchTrendingVideos = async () => {
      if (fetching) return;
      setFetching(true);
      console.log('Fetching trending videos or loading from cache...');

      try {
        setLoading(true);

        // Check cache first
        const cachedTrending = await AsyncStorage.getItem(
          'cachedTrendingVideos',
        );
        if (cachedTrending) {
          console.log('Loading trending videos from cache');
          const parsedTrending = JSON.parse(cachedTrending);
          setVideoUrl(parsedTrending);
          setHasVideo(parsedTrending.length > 0);
          return;
        }

        // No cache, call trending API
        console.log('No cache found, fetching trending from API...');
        const response = await fetch(`${env.baseURL}/api/videos/trending`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch trending videos: ${response.statusText}`,
          );
        }

        const videoData = await response.json();

        if (!Array.isArray(videoData) || videoData.length === 0) {
          console.warn('No trending videos available');
          setVideoUrl([]);
          setHasVideo(false);
          return;
        }

        const trendingVideos = videoData.map(video => ({
          Id: video.id,
          uri: video.videoUrl,
          thumbnail: video.thumbnail,
        }));
console.log('====================================');
console.log('Trending Videos:', trendingVideos);
console.log('====================================');
        setVideoUrl(trendingVideos);
        setHasVideo(true);

        // Cache trending videos
        await AsyncStorage.setItem(
          'cachedTrendingVideos',
          JSON.stringify(trendingVideos),
        );
        console.log('Trending videos cached successfully');
      } catch (error) {
        console.error('Error fetching trending videos:', error);
        setHasVideo(false);
      } finally {
        setLoading(false);
        setLoadingThumbnails(false);
        setFetching(false);
      }
    };

    fetchTrendingVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
            renderItem={({item, index}) => (
              <TouchableOpacity
                onPress={() => {
                  console.log('VideoId', item.Id, 'Index', index);
                  navigation.navigate('TrendSwipe', {
                    videoId: item.Id,
                    index: index,
                  });
                }}
                style={[styles.videoItem]}>
                {item.thumbnail ? (
                  <ImageBackground
                    source={{uri: item.thumbnail}}
                    style={styles.videoPlayer}
                    resizeMode="contain">
                    {visibleVideoIndex === index && (
                      <Video
                        source={{uri: item.thumbnail}}
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
            initialNumToRender={1} // Load one video at a time
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

export default MyVideos;

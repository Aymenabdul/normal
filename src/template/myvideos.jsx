import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from './env';

const MyVideos = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [hasVideo, setHasVideo] = useState(false);
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisibleVideoIndex(viewableItems[0].index);
    }
  }, []);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiUserId = await AsyncStorage.getItem('userId');
        setFirstName(apiFirstName || '');
        setUserId(apiUserId ? parseInt(apiUserId, 10) : null);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('wezume', 'Do you want to go back?', [
        { text: 'Cancel', style: 'cancel' },
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
      try {
        setLoading(true);
        const response = await fetch(`${env.baseURL}/api/videos/videos`);
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.statusText}`);
        }

        const videoData = await response.json();
        if (Array.isArray(videoData) && videoData.length > 0) {
          setVideoList(
            videoData.map(video => ({
              id: video.id,
              uri: video.videoUrl,
              thumbnail: video.thumbnail || null,
            }))
          );
          setHasVideo(true);
        } else {
          setHasVideo(false);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        Alert.alert('Error', 'Failed to load videos.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchVideos();
    }
  }, [userId]);

  const fetchProfilePic = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(
        `${env.baseURL}/users/user/${userId}/profilepic`,
        { responseType: 'arraybuffer' }
      );
      const base64Image = `data:image/jpeg;base64,${Buffer.from(
        response.data,
        'binary'
      ).toString('base64')}`;
      setProfileImage(base64Image);
    } catch (error) {
      setProfileImage(null);
    }
  };

  useEffect(() => {
    fetchProfilePic();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Header profile={profileImage} userName={firstName} />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : hasVideo ? (
        <FlatList
          data={videoList}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('MySwipe', {
                  videoId: item.id,
                  index: index,
                });
              }}
              style={styles.card}
            >
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noThumbnail}>
                  <Text style={styles.noThumbnailText}>No Thumbnail</Text>
                </View>
              )}
              <Text style={styles.videoTitle}>Video {item.id}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.videoList}
        />
      ) : (
        <Text style={styles.emptyListText}>No videos available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loader: { marginTop: 20 },
  videoList: { paddingHorizontal: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    margin: 10,
    flex: 1,
    elevation: 2,
  },
  thumbnail: { width: '100%', height: 150 },
  noThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  noThumbnailText: { color: '#757575' },
  videoTitle: {
    padding: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#757575',
  },
});

export default MyVideos;

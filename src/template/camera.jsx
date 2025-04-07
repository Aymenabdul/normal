import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
} from 'react-native-vision-camera';
import Flash from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import Media from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import axios from 'axios';
import env from './env';

const CameraPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userId} = route.params || null;
  console.log('UserId passed:', userId); // Log UserId

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(60); // 30-second timer
  const [onFlash, setOnFlash] = useState('off');
  const [videoPath, setVideoPath] = useState(null); // Store video path
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [isUploading, setUploading] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [videoUri, setVideoUri] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const cameraRef = useRef(null);
  const {hasPermission, requestPermission} = useCameraPermission();
  let timerInterval = useRef(null);
  const device = useCameraDevice(isFrontCamera ? 'front' : 'back');

  const format = useCameraFormat(device, [{fps: 20}]);
  const fps = format.minFps;

  // Trigger the alert when the component is mounted (camera screen entered)
  useEffect(() => {
    Alert.alert(
      'Note',
      'The video needs to be recorded for more than 30 seconds to upload.',
      [{text: 'OK', onPress: () => console.log('OK Pressed')}],
      {cancelable: false},
    );
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request permissions for storage, microphone, and phone
        const storagePermission = await request(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        );
        const microphonePermission = await request(
          PERMISSIONS.ANDROID.RECORD_AUDIO,
        );
        const phonePermission = await request(
          PERMISSIONS.ANDROID.READ_PHONE_STATE,
        );

        console.log('Storage permission:', storagePermission);
        console.log('Microphone permission:', microphonePermission);
        console.log('Phone permission:', phonePermission);

        // Handle permission results
        if (
          storagePermission === RESULTS.GRANTED &&
          microphonePermission === RESULTS.GRANTED &&
          phonePermission === RESULTS.GRANTED
        ) {
          console.log('All permissions granted');
        } else {
          console.log('Some permissions are denied');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    // Request permissions on component mount
    requestPermissions();
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);
  // Debug log for permission status
  console.log('Camera permission:', hasPermission);

  if (!device) {
    console.log('No camera device found.');
    return (
      <ActivityIndicator
        style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
      />
    );
  }

  const generateRandomFileName = () => {
    const timestamp = Date.now(); // Get the current timestamp
    const randomString = Math.random().toString(36).substring(2, 15); // Generate a random string
    return `${timestamp}_${randomString}.mp4`; // Combine timestamp and random string to form a unique file name
  };
  const handleUploadVideo = async () => {
    const randomFileName = generateRandomFileName();
    if (!videoUri) {
      alert('No video found to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0); // Reset progress when starting upload

    let formattedUri =
      Platform.OS === 'android' ? 'file://' + videoUri : videoUri;

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: formattedUri,
        type: 'video/mp4',
        name: randomFileName,
      });
      formData.append('userId', userId);

      const response = await axios.post(
        `${env.baseURL}/api/videos/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent); // Update the progress state
          },
        },
      );

      console.log('Upload Response', response);

      const {filePath, fileName, id} = response.data;
      if (filePath && id) {
        alert('Video uploaded successfully!');
        const videoUrl = `${env.baseURL}/${filePath.replace(/\\/g, '/')}`;
        const newvideos = {
          id,
          name: fileName,
          url: videoUrl,
        };

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Transcribe',
              params: {userId, videos: [...videos, newvideos]},
            },
          ],
        });
        setCurrentTimer(60); // Reset the timer
        setUploading(false);
      } else {
        alert('Unexpected response from server. Missing required fields.');
      }
    } catch (error) {
      alert('Error uploading video. Please try again.');
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        setIsPaused(false);

        console.log('Starting recording...');
        cameraRef.current.startRecording({
          onRecordingFinished: async video => {
            console.log('Recording finished. Video saved at:', video.path);
            setVideoPath(video.path);
            setVideoUri(video.path);
            setIsRecording(false);
          },
          onRecordingError: error => {
            console.error('Recording error:', error);
            setIsRecording(false);
          },
        });

        // Set a countdown timer for 30 seconds
        timerInterval.current = setInterval(() => {
          setCurrentTimer(prev => {
            if (prev === 1) {
              clearInterval(timerInterval.current);
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
      }
    } else {
      console.warn('Camera reference is not available or already recording.');
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current) {
      console.log('Stopping recording...');
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerInterval.current);
    }
  };

  const openTutorial = () => {
    const url = 'https://wezume.com/wezume-demo-video.mp4';
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}>
      <Camera
        ref={cameraRef}
        device={device}
        isActive={true}
        style={{position: 'absolute', height: '100%', width: '100%'}}
        video={true}
        audio={true} // Ensure audio is enabled
        torch={onFlash}
        format={format}
        fps={fps}
      />

      {/* Flash Toggle */}
      <TouchableOpacity
        style={styles.flashButton}
        onPress={() =>
          setOnFlash(currentVal => (currentVal === 'off' ? 'on' : 'off'))
        }>
        <Flash
          name={onFlash === 'off' ? 'flash-on' : 'flash-off'}
          color="white"
          size={30}
        />
      </TouchableOpacity>

      {/* Exit Button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.exitText}>X</Text>
      </TouchableOpacity>
      {/* Camera Switch Button */}
      <TouchableOpacity
        style={styles.switchCameraButton}
        onPress={() => setIsFrontCamera(prev => !prev)}>
        <MaterialCommunityIcons
          name={'camera-flip-outline'}
          size={35}
          style={styles.camicon}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.infoButton} onPress={openTutorial}>
        <AntDesign name={'infocirlce'} size={30} style={styles.infoicon} />
      </TouchableOpacity>

      {/* Timer */}
      <View style={styles.timer}>
        <Text style={styles.timerText}>
          {isRecording ? currentTimer.toString().padStart(2, '0') : '00:60'}
        </Text>
      </View>
      {/* Record Button */}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording ? styles.recording : styles.notRecording,
        ]}
        onPress={isRecording ? stopRecording : startRecording}>
        <View style={styles.innerCircle}></View>
      </TouchableOpacity>

      {/* Modal for Playback */}
      {videoPath && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Play Recorded Video</Text>
            <Video
              source={{uri: videoPath}}
              style={styles.videoPlayer}
              controls={true}
              resizeMode="contain"
            />
            <View
              style={{
                justifyContent: 'space-around',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
              }}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => {
                  setShowModal(false); // Close the modal
                  setCurrentTimer(60); // Reset the timer
                }}>
                <Text style={styles.closeModalText}>Redo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUploadVideo}
                style={{
                  backgroundColor: 'green',
                  padding: 10,
                  borderRadius: 5,
                  marginTop: 20,
                }}>
                <Text style={styles.closeModalText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Loading Spinner */}
          {/* Loading Spinner */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.uploadingText}>
            Uploading... {uploadProgress}%
          </Text>
          {/* Displaying the progress here */}
        </View>
      )}
        </Modal>
      )}

      {/* Show Modal Button */}
      {/* Show Modal Button */}
      {videoPath && !isRecording && currentTimer <= 30 && (
        <TouchableOpacity
          style={styles.showModalButton}
          onPress={() => setShowModal(true)}>
          <Media name="eye" size={35} color={'white'} />
          <Text style={{color: '#ffffff', marginLeft: -8}}>preview</Text>
          {/* <View>{handleAlert}</View> */}
        </TouchableOpacity>
      )}

      {/* Loading Spinner */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flashButton: {
    position: 'absolute',
    left: 20,
    top: 40,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    padding: 5,
  },
  exitButton: {
    position: 'absolute',
    right: 20,
    top: 40,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {color: 'white', fontSize: 20, fontWeight: 'bold'},
  timer: {position: 'absolute', bottom: '90%'},
  timerText: {color: 'white', fontSize: 24, fontWeight: '700'},
  recordButton: {
    position: 'absolute',
    bottom: 50,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  recording: {backgroundColor: 'red', borderWidth: 2, borderColor: 'white'},
  notRecording: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
  },
  innerCircle: {
    height: '90%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  modalHeader: {color: 'white', fontSize: 20, marginBottom: 20},
  videoPlayer: {width: '100%', height: '70%'},
  closeModalButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeModalText: {color: 'white', fontSize: 16},
  showModalButton: {
    position: 'absolute',
    bottom: 130,
    padding: 10,
    borderRadius: 5,
    left: '44%',
  },
  showModalText: {color: 'white', fontSize: 16},
  controlButtons: {
    position: 'absolute',
    bottom: 120,
    right: 145,
    // flexDirection: 'row',
    width: '100%',
    // backgroundColor:'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    // backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginLeft: '70%',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    height:'100%',
    width:'100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  // To make the overlay dark
    padding: 20,
    borderRadius: 10,
  },
  uploadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: '8%',
    left: '25%',
    transform: [{translateX: -50}],
    padding: 10,
    borderRadius: 10,
  },
  infoButton: {
    position: 'absolute',
    bottom: '6%',
    left: '90%',
    transform: [{translateX: -50}],
    padding: 10,
  },
  switchCameraText: {
    color: 'white',
    fontSize: 18,
  },
  camicon: {
    color: '#ffffff',
    position: 'absolute',
  },
  infoicon: {
    color: '#ffffff',
    // left: 176,
    // bottom: 38,
  },
});

export default CameraPage;

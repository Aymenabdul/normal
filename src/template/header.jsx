import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  ImageBackground,
  Animated,
  Dimensions,
  Modal,
  Button,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import User from 'react-native-vector-icons/FontAwesome';
import Menu from 'react-native-vector-icons/AntDesign';
import Search from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-vector-icons/Foundation';
import Faq from 'react-native-vector-icons/AntDesign';
import Logout from 'react-native-vector-icons/AntDesign';
import Noti from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const Header = ({Value, profile, userName}) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(width)).current; // Initial position off-screen to the left
  const [notifications, setNotifications] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const logouts = async () => {
    await AsyncStorage.removeItem('jobOption');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('firstName');
    await AsyncStorage.removeItem('jobOption');
    await AsyncStorage.removeItem('profilepic');
    await AsyncStorage.removeItem('industry');
    await AsyncStorage.removeItem('experience');
    await AsyncStorage.removeItem('city');
    await AsyncStorage.removeItem('skills');
    await AsyncStorage.removeItem('currentEmployer');
    navigation.navigate('LoginScreen');
  };

  const toggleMenu = () => {
    if (menuVisible) {
      // Slide out to the left
      Animated.timing(slideAnimation, {
        toValue: width, // Slide out of view
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      // Slide in from the left
      setMenuVisible(true);
      Animated.timing(slideAnimation, {
        toValue: 0, // Slide into view
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Fetch notifications from AsyncStorage
  const fetchNotifications = async () => {
    try {
      const storedNotifications =
        JSON.parse(await AsyncStorage.getItem('likeNotifications')) || [];
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Save notifications to AsyncStorage
  const saveNotifications = async newNotifications => {
    try {
      await AsyncStorage.setItem(
        'likeNotifications',
        JSON.stringify(newNotifications),
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    try {
      await AsyncStorage.removeItem('likeNotifications');
      setNotifications([]); // Clear state as well
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update AsyncStorage whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications);
    }
  }, [notifications]);

  return (
    <ImageBackground
      source={require('./assets/login.jpg')}
      style={styles.header}>
      {/* Left Section - Profile */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Account')}>
          <View style={styles.profileContainer}>
            {profile ? (
              <Image source={{uri: profile}} style={styles.profileImage} />
            ) : (
              <User name="user" color="#ffffff" size={30} />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.option}>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        style={styles.noti}>
        <Noti name={'bell-o'} size={20} color={'#ffffff'} />
      </TouchableOpacity>
      {/* Right Section - Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Menu name="menufold" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Full-Screen Sliding Menu */}
      <Modal
        transparent={true}
        visible={menuVisible}
        onRequestClose={toggleMenu}>
        <View style={styles.modalOverlay}>
          {/* Sliding Menu */}
          <Animated.View
            style={[
              styles.modalMenu,
              {transform: [{translateX: slideAnimation}]},
            ]}>
            <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
              <Text style={styles.options}>
                <User name={'user'} size={20} color={'grey'} /> Profile
              </Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
            <TouchableOpacity onPress={() =>[navigation.navigate('profile'),setIsModalVisible(false) ]}>
              <Text style={styles.options}>
                <Search name={'search'} size={22} color={'grey'} /> Search
              </Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
            <TouchableOpacity onPress={''}>
              <Text style={styles.options}>
                <Video name={'comment-video'} size={22} color={'grey'} />{' '}
                Tutorial Video
              </Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
            <TouchableOpacity onPress={''}>
              <Text style={styles.options}>
                <Faq name={'questioncircle'} size={20} color={'grey'} /> FAQ
              </Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
            <TouchableOpacity
              onPress={logouts}>
              <Text style={styles.options}>
                <Logout name={'logout'} size={20} color={'grey'} /> Logout
              </Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
          </Animated.View>
        </View>
      </Modal>
      <Modal
        visible={isModalVisible}
        transparent={false} // Full-screen modal
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={{flex: 1, backgroundColor: 'white', padding: 20}}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              marginBottom: 10,
              textAlign: 'center',
            }}>
            Notifications
          </Text>
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <View style={styles.noticont}>
                <Text style={{fontSize: 16}}>
                  {item.firstName} ❤️ liked your video.
                </Text>
              </View>
            )}
          />
          <View style={{marginTop: 20}}>
            <TouchableOpacity
              style={{
                backgroundColor: '#FF0000',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 10,
              }}
              onPress={clearNotifications}>
              <Text style={{color: 'white', fontSize: 16}}>
                Clear Notifications
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#007BFF',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={() => setIsModalVisible(false)}>
              <Text style={{color: 'white', fontSize: 16}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 70,
    zIndex:100,
  },
  profileSection: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 20,
  },
  menuSection: {
    padding: 10,
    marginLeft: 160,
  },
  option: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginLeft: -10,
  },
  menuButton: {
    marginRight: '5%',
    zIndex:10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent dark overlay
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  modalMenu: {
    width: '80%',
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    position: 'absolute',
    right: 0, // Align to the left
    top: 0,
  },
  menuItem: {
    fontSize: 18,
    color: '#333',
    marginVertical: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  options: {
    fontSize: 18,
    margin: 10,
    color: '#000',
  },
  line: {
    width: '90%', // Adjusted to span across most of the modal
    backgroundColor: '#ccc', // Corrected from `color` to `backgroundColor`
    height: 1, // Keeps the line thin
    alignSelf: 'flex-start', // Centers the line within the container
    marginVertical: 5, // Adds spacing between lines
  },
  noticont: {
    height: 50, // Adjusted height for better readability
    width: '100%',
    backgroundColor: '#ffffff',
    elevation: 5,
    borderRadius: 10,
    justifyContent: 'center',
    marginBottom: 10, // Adds spacing between items
    padding: 10, // Optional: Adds internal spacing for better content alignment
  },
  noti: {
    marginLeft: '30%',
  },
});

export default Header;
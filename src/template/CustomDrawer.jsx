import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';

const CustomDrawer = (props) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    firstName: '',
    profilepic: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      const firstName = await AsyncStorage.getItem('firstName');
      const profilepic = await AsyncStorage.getItem('profilepic');
      setUserData({ firstName, profilepic });
    };
    loadUserData();
  }, []);

  const logouts = async () => {
    try {
      const keysToRemove = [
        'jobOption',
        'userId',
        'firstName',
        'profilepic',
        'industry',
        'experience',
        'city',
        'skills',
        'currentEmployer',
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      navigation.navigate('LoginScreen');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View style={styles.profileSection}>
        {userData.profilepic ? (
          <Image source={{ uri: userData.profilepic }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar} />
        )}
        <Text style={styles.nameText}>{userData.firstName || 'Guest'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={logouts} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  placeholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#bbb',
  },
  nameText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 20,
  },
  logoutButton: {
    paddingVertical: 10,
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomDrawer;

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Skills from 'react-native-vector-icons/Foundation';
import Expe from 'react-native-vector-icons/MaterialCommunityIcons';
import Indus from 'react-native-vector-icons/FontAwesome';
import Locat from 'react-native-vector-icons/FontAwesome';
import Back from 'react-native-vector-icons/AntDesign';
import Lang from 'react-native-vector-icons/FontAwesome';
import Email from 'react-native-vector-icons/Entypo';
import Phone from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {Buffer} from 'buffer';
import env from './env';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState();
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState('');
  const [firstName, setFirstName] = useState('');
  const [languages , setLanguages] = useState('');
  const [industry, setIndustry] = useState('');
  const [experience, setExperience] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [organizationName , setOrganizationName] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [jobOption,setJobOption] = useState('');
  const [currentRole,setCurrentRole] = useState('');
  const [videoId, setVideoId] = useState(null); // Example videoId (this should be dynamically assigned)
  const [lastName,setLastName] = useState('');
  const [email,setEmail] = useState('');
  const [phoneNumber,setPhoneNumber] = useState('');

  useEffect(() => {
    const Asyncstorage = async () => {
      try {
        const apiFirstName = await AsyncStorage.getItem('firstName');
        const apiIndustry = await AsyncStorage.getItem('industry');
        const apiUserId = await AsyncStorage.getItem('userId');
        const apiVideoId = await AsyncStorage.getItem('videoId');
        const apicurrentEmployer = await AsyncStorage.getItem(
          'currentEmployer',
        );

        if (apiUserId) {
          setUserId(apiUserId);
        }
        setFirstName(apiFirstName || '');
        setIndustry(apiIndustry || '');
        setCurrentEmployer(apicurrentEmployer || '');
        setVideoId(apiVideoId || '');

        console.log('AsyncStorage data:', {
          apiFirstName,
          apiIndustry,
          apiUserId,
          apiVideoId,
          apicurrentEmployer,
        });

        if (userId) {
          fetchUserDetails(userId); // Pass apiUserId to fetchUserDetails
        }
        if (videoId) {
          fetchLikeCount(videoId);
        }
      } catch (error) {
        console.error('Error getting data from AsyncStorage:', error);
      }
    };

    Asyncstorage();
  }); // Empty array to run only once after component mount

  // Fetch user details and store in AsyncStorage
  const fetchUserDetails = async userId => {
    try {
      console.log('Fetching user details for userId:', userId); // Debug log

      const response = await axios.get(
        `${env.baseURL}/api/videos/getOwnerByUserId/${userId}`,
      );

      // console.log('User Details Response:', response);

      if (response.data) {
        const user = response.data;

        // Safely store user details in AsyncStorage
        await handleAsyncStorage('firstName', user.firstName);
        await handleAsyncStorage('lastName',user.lastName);
        await handleAsyncStorage('industry', user.industry);
        await handleAsyncStorage('experience', user.experience);
        await handleAsyncStorage('city', user.city);
        await handleAsyncStorage('currentEmployer', user.currentEmployer);
        await handleAsyncStorage('languages' , user.languages);
        await handleAsyncStorage('jobOption',user.jobOption);
        await handleAsyncStorage('organizationName',user.organizationName);
        await handleAsyncStorage('currentRole',user.currentRole);
        await handleAsyncStorage('KeySkills',user.keySkills);
        await handleAsyncStorage('email',user.email);
        await handleAsyncStorage('phoneNumber',user.phoneNumber);


        // Update state
        setFirstName(user.firstName || '');
        setIndustry(user.industry || '');
        setExperience(user.experience || '');
        setCity(user.city || '');
        setSkills(user.keySkills || '');
        setCurrentEmployer(user.currentEmployer || '');
        setLanguages(user.languages || '');
        setJobOption(user.jobOption || '');
        setOrganizationName(user.organizationName || '');
        setCurrentRole(user.currentRole || '');
        setLastName(user.lastName || '');
        setPhoneNumber(user.phoneNumber);
        setEmail(user.email);

        console.log('User Data:', {
          firstName: user.firstName,
          industry: user.industry,
          experience: user.experience,
          city: user.city,
          KeySkills: user.keySkills,
          currentEmployer: user.currentEmployer,
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Helper function to safely store in AsyncStorage
  const handleAsyncStorage = async (key, value) => {
    if (value !== null && value !== undefined) {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.removeItem(key); // Remove if null or undefined
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfilePic(userId);
    } else {
      console.error('No userId found');
      setLoading(false);
    }
  }, [userId]);

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

  const fetchLikeCount = async videoId => {
    console.log('Fetching like count for videoId:', videoId); // Check if the videoId is correct
    try {
      const response = await axios.get(
        `${env.baseURL}/api/videos/${videoId}/like-count`, // Use videoId in the URL
      );
      console.log('API response:', response.data); // Check if the data is correct
      setLikeCount(response.data); // Update state with like count or default to 0
    } catch (error) {
      console.error('Error fetching like count:', error);
      setLikeCount(0); // Reset like count on error
    }
  };

  const DeleteLink = () => {
      const url = 'https://wezume.com/delete/';
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

  return (
    <>
      <ImageBackground
        source={require('./assets/login.jpg')}
        style={styles.bodycont}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Back name={'leftcircle'} size={24} style={styles.backoption} />
        </TouchableOpacity>
      </ImageBackground>
      <View style={styles.container}>
        {/* Header with Profile Picture */}
        <View style={styles.header}>
          <Image source={{uri: profileImage}} style={styles.profileImage} />
          <Text style={styles.profileName}>{firstName} {lastName}</Text>
          <Text style={styles.jobTitle}>{industry}</Text>
        </View>

        {/* Likes Section */}
        <View style={styles.likesContainer}>
          <FontAwesome name="thumbs-up" size={24} color="#007bff" />
          <Text style={styles.likesText}>{likeCount}</Text>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileButton} onPress={()=> navigation.navigate('Edit')}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editProfileButton} onPress={DeleteLink}>
          <Text style={styles.editProfileText}>Delete Account</Text>
        </TouchableOpacity>

        <ScrollView
          style={{width: '100%'}}
          showsVerticalScrollIndicator={false}>
          {/* Skills Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Email name={'email'} size={16} /> Email
            </Text>
            <Text style={styles.sectionContent}>{email}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Phone name={'mobile-phone'} size={22} /> PhoneNumber
            </Text>
            <Text style={styles.sectionContent}>{phoneNumber}</Text>
          </View>
          {jobOption === 'Employee' && (
            <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Skills name={'social-skillshare'} size={22} /> Skills
            </Text>
            <Text style={styles.sectionContent}>{skills}</Text>
          </View>

          {/* Experience Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Expe name={'shield-star-outline'} size={20} /> Experience
            </Text>
            <Text style={styles.sectionContent}>
              {industry} at {currentEmployer} || years of experience{''}
              {experience}
            </Text>
            {/* <TouchableOpacity>
          <Text style={styles.viewMore}>See all Experiences</Text>
        </TouchableOpacity> */}
          </View>

          {/* Industry and City Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Indus name={'industry'} size={15} /> Industry
            </Text>
            <Text style={styles.sectionContent}>{industry}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> City
            </Text>
            <Text style={styles.sectionContent}>{city}</Text>
          </View>
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Lang name={'language'} size={18} /> Language
            </Text>
            <Text style={styles.sectionContent}>{}</Text>
          </View> */}
          </>
          )}
          {jobOption === 'Investor' && (
           <>
           <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Lang name={'language'} size={18} /> Organization Name
            </Text>
            <Text style={styles.sectionContent}>{currentEmployer}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> City
            </Text>
            <Text style={styles.sectionContent}>{city}</Text>
          </View>
           </>
          )}
          {jobOption === 'Employer' && (
           <>
           <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Lang name={'language'} size={18} /> Organization Name
            </Text>
            <Text style={styles.sectionContent}>{currentEmployer}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> City
            </Text>
            <Text style={styles.sectionContent}>{city}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> Industry
            </Text>
            <Text style={styles.sectionContent}>{industry}</Text>
          </View>
           </>
          )}
          {jobOption === 'Entrepreneur' && (
           <>
           <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Lang name={'language'} size={18} /> Keyskills
            </Text>
            <Text style={styles.sectionContent}>{skills}</Text>
          </View>
           <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Lang name={'language'} size={18} /> current Roll
            </Text>
            <Text style={styles.sectionContent}>{currentRole}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> City
            </Text>
            <Text style={styles.sectionContent}>{city}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Locat name={'location-arrow'} size={20} /> Industry
            </Text>
            <Text style={styles.sectionContent}>{industry}</Text>
          </View>
           </>
          )}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  bodycont: {
    flex: 2,
    resizeMode: 'cover',
    width: '100%',
  },
  container: {
    flex: 9,
    padding: 20,
    backgroundColor: '#f7f8fc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: '-20%',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    elevation: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color:'black',
  },
  jobTitle: {
    fontSize: 16,
    color: 'gray',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
    height: 40,
    width: 60,
    borderRadius: 50,
    marginLeft: '40%',
    marginBottom: 20,
    elevation: 10,
  },
  likesText: {
    fontSize: 16,
    marginLeft: 5,
    color: 'gray',
  },
  editProfileButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  editProfileText: {
    color: 'white',
    fontSize: 16,
  },
  section: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    height: 100,
    borderRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'gray',
    marginBottom: -5,
    padding: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: 'gray',
    padding:10,
  },
  viewMore: {
    color: '#007bff',
    fontSize: 16,
  },
  backoption: {
    color: '#ffffff',
    padding: 10,
    marginLeft: '3%',
    marginTop: '5%',
  },
});

export default ProfileScreen;

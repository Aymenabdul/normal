import React, {useEffect, useState} from 'react';
import {
  Image,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import UploadImage from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import Back from 'react-native-vector-icons/AntDesign';
import axios from 'axios';
import {Buffer} from 'buffer';
import env from './env';

const Profile = () => {
  const [currentRole, setCurrentRole] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [experience, setExperience] = useState([]);
  const [industry, setIndustry] = useState([]);
  const [firstName, setFirstNmae] = useState('');
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState([]);
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] =
    useState(false);
  const [industrySearchText, setIndustrySearchText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [FilteredVideos, setFilteredVideos] = useState([]);
  const route = useRoute();

  const experienceOptions = [
    {label: '0-1 years', value: '0-1'},
    {label: '1-3 years', value: '1-3'},
    {label: '3-5 years', value: '3-5'},
    {label: '5-10 years', value: '5-10'},
    {label: '10-15 years', value: '10-15'},
    {label: '15+ years', value: '10+'},
  ];

  const cityOptions = [
    'New Delhi',
    'Mumbai',
    'Bengaluru',
    'Chennai',
    'Hyderabad',
    'Pune',
    'Kolkata',
  ];

  const industries = [
    'Banking & Finance',
    'Biotechnology',
    'Construction',
    'Consumer Goods',
    'Education',
    'Energy',
    'Healthcare',
    'Media & Entertainment',
    'Hospitality',
    'Information Technology (IT)',
    'Insurance',
    'Manufacturing',
    'Non-Profit',
    'Real Estate',
    'Retail',
    'Transportation',
    'Travel & Tourism',
    'Textiles',
    'Logistics & Supply Chain',
    'Sports',
    'E-commerce',
    'Consulting',
    'Advertising & Marketing',
    'Architecture',
    'Arts & Design',
    'Environmental Services',
    'Human Resources',
    'Legal',
    'Management',
    'Telecommunications',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(100), (val, index) => currentYear - index);
  const filteredIndustries = industries.filter(industry =>
    industry.toLowerCase().includes(industrySearchText.toLowerCase()),
  );

  const toggleIndustryDropdown = () =>
    setIsIndustryDropdownOpen(!isIndustryDropdownOpen);

  const selectIndustry = selectedIndustry => {
    setIndustry(prevState =>
      prevState.includes(selectedIndustry)
        ? prevState.filter(industry => industry !== selectedIndustry)
        : [...prevState, selectedIndustry],
    );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleExperienceDropdown = () => {
    setIsExperienceDropdownOpen(!isExperienceDropdownOpen);
  };

  const selectCity = cityName => {
    setCity(prevState =>
      prevState.includes(cityName)
        ? prevState.filter(city => city !== cityName)
        : [...prevState, cityName],
    );
    setIsDropdownOpen(false); // Close dropdown after selection
    setSearchText(''); // Clear search text
  };

  const selectExperience = selectedExperience => {
    setExperience(prevState =>
      prevState.includes(selectedExperience)
        ? prevState.filter(exp => exp !== selectedExperience)
        : [...prevState, selectedExperience],
    );
    setIsExperienceDropdownOpen(false); // Close experience dropdown after selection
  };

  const filteredCities = cityOptions.filter(cityName =>
    cityName.toLowerCase().includes(searchText.toLowerCase()),
  );


  const handleFilter = async () => {
    const filterData = {
      keySkills: keySkills ? keySkills : '',
      experience: experience && experience.length > 0 ? experience[0] : '',
      industry: industry && industry.length > 0 ? industry[0] : '',
      city: city && city.length > 0 ? city[0] : '',
    };

    console.log('Sending filter data:', filterData); // Log the data being sent

    setLoading(true);

    try {
      const response = await axios.post(
        `${env.baseURL}/api/videos/filter`,
        filterData,
      );
      const filteredVideo = response.data;
      console.log('Filtered videos received:', filteredVideo);

      if (Array.isArray(filteredVideo) && filteredVideo.length > 0) {
        const videosWithUri = filteredVideo.map(video => ({
          ...video,
          uri: `${env.baseURL}/api/videos/user/${video.userId}`,
        }));

        setFilteredVideos(videosWithUri);
        navigation.navigate('Filtered', {
          filteredVideos: videosWithUri,
          isFiltered: true,
        });
      } else {
        // Show a popup and navigate back to Filtered
        alert('No videos found for the selected filter.');
        navigation.navigate('Filtered', {
          filteredVideos: [],
          isFiltered: true,
        });
      }
    } catch (err) {
      alert('Error fetching filtered videos');
      console.error(err.response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <><View style={styles.backarrow}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Back name={'leftcircle'} size={24} color={'#ffffff'} style={{elevation:10}} />
      </TouchableOpacity>
    </View><FastImage
      style={styles.backgroundImage}
      source={require('./assets/login1.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
        {/* <Image style={styles.img} source={require('./assets/Png-02.png')} /> */}
        <LinearGradient colors={['#d3e4f6', '#a1d1ff']} style={styles.container}>
          {/* <Image style={styles.img2} source={require('./assets/logo.png')} /> */}
          <Text style={styles.title}>Search</Text>

          <TextInput
            style={styles.input}
            placeholder="Key Skills"
            placeholderTextColor="#000"
            value={keySkills}
            onChangeText={setKeySkills} />

          {/* Experience Checkboxes */}
          <TouchableOpacity
            onPress={toggleExperienceDropdown}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>
              {experience.length ? experience.join(', ') : 'Select Experience'}
            </Text>
            <UploadImage name="menu-down" size={20} />
          </TouchableOpacity>

          {/* Experience Dropdown Content */}
          {isExperienceDropdownOpen && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
                {experienceOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => selectExperience(option.value)}
                    style={styles.checkboxContainer}>
                    <Text style={styles.checkboxText}>
                      {experience.includes(option.value) ? '✔️' : '⭕'}{' '}
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Industry Checkboxes */}
          <TouchableOpacity
            onPress={toggleIndustryDropdown}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>
              {industry.length ? industry.join(', ') : 'Select Industry'}
            </Text>
            <UploadImage name="menu-down" size={20} />
          </TouchableOpacity>

          {/* Industry Dropdown Content */}
          {isIndustryDropdownOpen && (
            <View style={styles.dropdownContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search industry"
                placeholderTextColor="#666"
                value={industrySearchText}
                onChangeText={setIndustrySearchText} />
              <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map(industryName => (
                    <TouchableOpacity
                      key={industryName}
                      onPress={() => selectIndustry(industryName)}
                      style={styles.checkboxContainer}>
                      <Text style={styles.checkboxText}>
                        {industry.includes(industryName) ? '✔️' : '⭕'}{' '}
                        {industryName}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    onPress={() => selectIndustry('Others')}
                    style={styles.checkboxContainer}>
                    <Text style={styles.checkboxText}>Others</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* City Checkboxes */}
          <TouchableOpacity
            onPress={toggleDropdown}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>
              {city.length ? city.join(', ') : 'Select City'}
            </Text>
            <UploadImage name="menu-down" size={20} />
          </TouchableOpacity>

          {/* City Dropdown Content */}
          {isDropdownOpen && (
            <View style={styles.dropdownContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search city"
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText} />
              <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
                {filteredCities.length > 0 ? (
                  filteredCities.map(cityName => (
                    <TouchableOpacity
                      key={cityName}
                      onPress={() => selectCity(cityName)}
                      style={styles.checkboxContainer}>
                      <Text style={styles.checkboxText}>
                        {city.includes(cityName) ? '✔️' : '⭕'} {cityName}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    onPress={() => selectCity('Others')}
                    style={styles.checkboxContainer}>
                    <Text style={styles.checkboxText}>Others</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
          <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
            <TouchableOpacity style={styles.signupButton} onPress={handleFilter}>
              <Text style={styles.signupButtonText}>Filter</Text>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>
      </FastImage></>
  );
};

const styles = StyleSheet.create({
  backarrow:{
    zIndex:10,
    marginBottom:'-8%',
    left:30,
    top:30,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    marginTop: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    width: '90%',
  },
  img: {
    width: 300,
    height: 350,
    marginBottom: -110,
    marginTop: 20,
  },
  img2: {
    width: '100%',
    height: 100,
    marginTop: -60,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ffffff',
    padding: 7,
    marginBottom: 10,
    borderRadius: 5,
    paddingLeft: 15,
    color: 'black',
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  dropdownButton: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  searchInput: {
    borderWidth: 1,
    padding: 5,
    marginBottom: 10,
    borderRadius: 5,
  },
  scrollView: {
    maxHeight: 150,
  },
  checkboxContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkboxText: {
    fontSize: 16,
  },
  signupButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 7,
  },
  signupButtonText: {
    fontWeight: '500',
    color: '#ffffff',
    fontSize: 20,
  },
  btn: {
    width: 150,
    marginLeft: 100,
    borderRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
});

export default Profile;

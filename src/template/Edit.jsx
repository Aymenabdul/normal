import React, {useState, useEffect} from 'react';
import {
  Image,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import UploadImage from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import {launchImageLibrary} from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from './env';

const Edit = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobOption, setJobOption] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null); // For profile pic
  const [currentRole, setCurrentRole] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [experience, setExperience] = useState('');
  const [industry, setIndustry] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [languagesKnown, setLanguagesKnown] = useState('');
  const [languages, setLanguages] = useState(['']);
  const navigation = useNavigation();
  const [base64Image, setBase64Image] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchText, setIndustrySearchText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [languageSearchText, setLanguageSearchText] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [userId, setUserId] = useState();
  const availableLanguages = [
    'English',
    'Hindi',
    'Bengali',
    'Marathi',
    'Telugu',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Malayalam',
    'Kannada',
  ];
  const experienceOptions = [
    {label: '  0-1 years', value: '0-1'},
    {label: '  1-3 years', value: '1-3'},
    {label: '  3-5 years', value: '3-5'},
    {label: '  5-10 years', value: '5-10'},
    {label: '  10-15 years', value: '10-15'},
    {label: '  15+ years', value: '10+'},
  ];
  const cityOptions = [
    'New Delhi',
    'Mumbai',
    'Bengaluru ',
    'Chennai ',
    'Hyderabad ',
    'Pune ',
    'Kolkata ',
    // Add more cities here
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
    // Add more industries as needed
  ];
  const handleLanguageChange2 = (text, index) => {
    setLanguageSearchText(text);
    setIsLanguageDropdownOpen(true);
    setFocusedIndex(index);
  };
  // Function to select a language from the dropdown
  const selectLanguage = language => {
    const updatedLanguages = [...languages];
    updatedLanguages[focusedIndex] = language;
    setLanguages(updatedLanguages);
    setIsLanguageDropdownOpen(false);
    setLanguageSearchText('');
    setFocusedIndex(null);
  };
  // Filter languages based on the language search text
  const filteredLanguages = availableLanguages.filter(
    language =>
      language.toLowerCase().includes(languageSearchText.toLowerCase()) &&
      !languages.includes(language),
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(100), (val, index) => currentYear - index);
  const removeLanguageField = index => {
    const newLanguages = languages.filter((_, i) => i !== index);
    setLanguages(newLanguages);
  };
  const filteredIndustries = industries.filter(industry =>
    industry.toLowerCase().includes(industrySearchText.toLowerCase()),
  );
  const toggleIndustryDropdown = () =>
    setIsIndustryDropdownOpen(!isIndustryDropdownOpen);
  const selectIndustry = selectedIndustry => {
    setIndustry(selectedIndustry);
    setIsIndustryDropdownOpen(false);
  };
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectCity = cityName => {
    setCity(cityName);
    setIsDropdownOpen(false); // Close dropdown after selection
    setSearchText(''); // Clear search text
  };

  const filteredCities = cityOptions.filter(cityName =>
    cityName.toLowerCase().includes(searchText.toLowerCase()),
  );
  const validateInputs = () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !jobOption ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Validation Error', 'All fields are required!');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Invalid email format!');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match!');
      return false;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit phone number!',
      );
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) {
      return;
    }
    // Check if email is already taken
    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      Alert.alert('Validation Error', 'Email is already registered!');
      return;
    }

    // Check if phone number is already taken
    const phoneExists = await checkIfPhoneExists(phoneNumber);
    if (phoneExists) {
      Alert.alert('Validation Error', 'Phone number is already registered!');
      return;
    }
  };

  useEffect(() => {
    const loadDataFromStorage = async () => {
      try {
        // Retrieve values from AsyncStorage
        const apiUserId = await AsyncStorage.getItem('userId');
        // Convert userId and videoId from string to integer
        const parsedUserId = apiUserId ? parseInt(apiUserId, 10) : null;
        // Log the retrieved and parsed values
        console.log('Retrieved userId:', parsedUserId);
        setUserId(parsedUserId); // Set parsed userId in state
        getUserDetails(parsedUserId);
      } catch (error) {
        console.error('Error loading user data from AsyncStorage', error);
      }
    };

    loadDataFromStorage();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  const getUserDetails = async userId => {
    try {
      const response = await axios.get(`${env.baseURL}/users/get/${userId}`);
      console.log('User details:', response.data);
      // Set the response data to your state variables
      setFirstName(response.data.firstName);
      setLastName(response.data.lastName);
      setEmail(response.data.email);
      setPhoneNumber(response.data.phoneNumber);
      setJobOption(response.data.jobOption);
      setProfilePic(response.data.profilePic);
      setCurrentRole(response.data.currentRole);
      setKeySkills(response.data.keySkills);
      setPassword(response.data.password);
      setConfirmPassword(response.data.confirmPassword);
      setExperience(response.data.experience);
      setCity(response.data.city);
      setIndustry(response.data.industry);
      setCurrentEmployer(response.data.currentEmployer);
      setLanguagesKnown(response.data.languagesKnown);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  const checkIfEmailExists = async email => {
    console.log('Checking email:', email); // Log the email you're checking
    try {
      const response = await axios.post(
        `${env.baseURL}/userscheck-email`,
        {email}, // Wrapping email in an object
        {headers: {'Content-Type': 'application/json'}},
      );
      console.log('Response from email check:', response.data); // Log the response from backend
      return response.data.exists; // Assuming the response returns { exists: true/false }
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const checkIfPhoneExists = async phoneNumber => {
    console.log('Checking phoneNumber:', phoneNumber);
    try {
      const response = await axios.post(
        `${env.baseURL}/userscheck-phone`,
        phoneNumber,
        {
          headers: {'Content-Type': 'application/json'},
        },
      );
      console.log('Response from phonenumber check:', response.data);
      return response.data; // Returns true if phone exists, false otherwise
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
  };

  const handleProfilePic = async () => {
    launchImageLibrary({mediaType: 'photo'}, async response => {
      if (response.didCancel) {
        console.log('User canceled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        try {
          // Convert image to Base64 string
          const base64String = await RNFS.readFile(imageUri, 'base64');
          // Remove any prefix
          const cleanBase64String = base64String.replace(
            /^data:image\/\w+;base64,/,
            '',
          );
          // Now you can set the cleanBase64String to your form data
          setBase64Image(cleanBase64String);
        } catch (error) {
          console.error('Error converting image to Base64: ', error);
        }
      }
    });
  };

  const handleUpdateProfile = async () => {
    if (!email) {
      Alert.alert('Email is required!');
      return;
    }

    if (!phoneNumber) {
      Alert.alert('Phone Number is required!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('please type the password correctly !!!');
      return;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert('Enter a valid mobile number');
      return;
    }
    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      Alert.alert('Validation Error', 'Email is already registered!');
      return;
    }

    // Check for public domain email if jobOption is "employer"
    if (jobOption === 'Employer') {
      const isPublicEmail = await checkIfPublicEmail(email);
      if (isPublicEmail) {
        Alert.alert(
          'Validation Error',
          'Employers must use a company email, not a public domain email!',
        );
        return;
      }
    }

    // Check if phone number is already taken
    const phoneExists = await checkIfPhoneExists(phoneNumber);
    if (phoneExists) {
      Alert.alert('Validation Error', 'Phone number is already registered!');
      return;
    }
    setLoading(true);
    try {
      const updatedUserData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        jobOption,
        password,
        confirmPassword,
        currentEmployer,
        currentRole,
        keySkills,
        experience,
        industry,
        city,
        languagesKnown,
        profilePic: base64Image, // Include profile picture if available
      };

      // Assuming you have a userId stored after login or signup
      const response = await axios.put(
        `${env.baseURL}/users/update/${userId}`, // Update the URL to match your backend route
        updatedUserData,
        {
          headers: {'Content-Type': 'application/json'},
        },
      );

      console.log('User updated:', response.data);
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack(); // Navigate to the previous screen
          },
        },
      ]);
    } catch (error) {
      console.error(
        'Profile update failed:',
        error.response ? error.response.data : error.message,
      );
      Alert.alert('Error', 'Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const checkIfPublicEmail = async () => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-Recruteremail`,
        {email},
        {headers: {'Content-Type': 'application/json'}},
      );
      console.log('Response from public email check:', response.data);

      // Check if the backend returned an error indicating a public domain email
      if (response.data.error === 'Public email domains are not allowed') {
        return true; // Email is from a public domain
      }
      return false; // Email is valid
    } catch (error) {
      console.error('Error checking public email:', error);
      return false; // Default to valid email if there's an error
    }
  };

  return (
    <FastImage
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
      {/* <Image style={styles.img} source={require('./assets/Png-02.png')} /> */}
      <LinearGradient colors={['#d3e4f6', '#a1d1ff']} style={styles.container}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.title}>Update Profile</Text>
        {/* scrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{height: '40%', width: '100%'}}
          contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
          {/* <Text style={styles.loginsub}>Create an account so you can explore all the existing jobs.</Text> */}
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor="#000"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#000"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#000"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <Picker
            selectedValue={jobOption}
            style={styles.picker}
            onValueChange={itemValue => {
              if (!jobOption) {
                setJobOption(itemValue); // Allow only if jobOption is not already set
              }
            }}>
            <Picker.Item
              style={{fontSize: 16}}
              label="  Select your role"
              value=""
            />
            <Picker.Item
              style={{fontSize: 16}}
              label="  Employer"
              value="Employer"
            />
            <Picker.Item
              style={{fontSize: 16}}
              label="  Freelancer"
              value="Freelancer"
            />
            <Picker.Item
              style={{fontSize: 16}}
              label="  Employee"
              value="Employee"
            />
            <Picker.Item
              style={{fontSize: 16}}
              label="  Entrepreneur"
              value="Entrepreneur"
            />
            <Picker.Item
              style={{fontSize: 16}}
              label="  Investor"
              value="Investor"
            />
          </Picker>
          {/* Role-specific fields */}
          {jobOption === 'Employee' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#000"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TextInput
                style={styles.input}
                placeholder="Current Role"
                placeholderTextColor="#000"
                value={currentRole}
                onChangeText={setCurrentRole}
              />
              <TextInput
                style={styles.input}
                placeholder="Key Skills"
                placeholderTextColor="#000"
                value={keySkills}
                onChangeText={setKeySkills}
              />
              <Picker
                selectedValue={experience}
                onValueChange={itemValue => setExperience(itemValue)}
                style={styles.picker}>
                <Picker.Item label="  Select Experience" value="" />
                {experienceOptions.map(option => (
                  <Picker.Item
                    label={option.label}
                    value={option.value}
                    key={option.value}
                  />
                ))}
              </Picker>
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, {maxHeight: 200}]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
              {/* Language Dropdown */}
              {languages.map((language, index) => (
                <View key={index} style={styles.languageInputContainer}>
                  <TouchableOpacity
                    onPress={() => handleLanguageChange2(language, index)}
                    style={styles.dropdownButton}>
                    <Text style={styles.dropdownButtonText}>
                      {language || 'Select Language'}
                    </Text>
                    <UploadImage name="menu-down" size={20} />
                  </TouchableOpacity>

                  {isLanguageDropdownOpen && focusedIndex === index && (
                    <View style={styles.dropdownContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search language"
                        placeholderTextColor="#666"
                        value={languageSearchText}
                        onChangeText={setLanguageSearchText}
                      />
                      <ScrollView
                        style={styles.scrollView}
                        nestedScrollEnabled={true}>
                        {filteredLanguages.length > 0 ? (
                          filteredLanguages.map(language => (
                            <TouchableOpacity
                              key={language}
                              onPress={() => selectLanguage(language)}
                              style={styles.dropdownOption}>
                              <Text style={styles.dropdownOptionText}>
                                {language}
                              </Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <TouchableOpacity
                            onPress={() => selectLanguage('Others')}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              Others
                            </Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* Remove button for each language field */}
                  {languages.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeLanguageField(index)}
                      style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Language Field Button */}
              {languages.length < 3 && (
                <TouchableOpacity
                  onPress={() => setLanguages([...languages, ''])}
                  style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Language</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {jobOption === 'Entrepreneur' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#000"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TextInput
                style={styles.input}
                placeholder="Current Role"
                placeholderTextColor="#000"
                value={currentRole}
                onChangeText={setCurrentRole}
              />
              <TextInput
                style={styles.input}
                placeholder="Key Skills"
                placeholderTextColor="#000"
                value={keySkills}
                onChangeText={setKeySkills}
              />
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, {maxHeight: 200}]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          {/* Role-specific fields */}
          {jobOption === 'Employer' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#000"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, {maxHeight: 200}]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          {/* Role-specific fields */}
          {jobOption === 'Investor' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#000"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                <UploadImage name="menu-down" size={20} />
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* Profile Picture Upload Button */}
          <TouchableOpacity
            onPress={handleProfilePic}
            style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
            <UploadImage name={'file-image-plus'} size={20} color={'white'} />
          </TouchableOpacity>
          {/* </> */}
          {/* )} */}
          {/* ScrollView */}
        </ScrollView>
        {/* Loading indicator and Sign Up button */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0077B5"
            style={styles.loadingIndicator}
          />
        ) : (
          <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleUpdateProfile}>
              <Text style={styles.signupButtonText}>Update</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Navigation to Login Screen */}
        <TouchableOpacity onPress={() => navigation.navigate('Account')}>
          <Text style={styles.logAccount}>
            <Text style={{color: 'blue'}}>Back to Profile</Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </FastImage>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  container: {
    width: '95%',
    borderColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 60,
    borderRadius: 10,
    marginTop: '10%',
    elevation: 5,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    marginLeft: 10,
    textAlign: 'center',
    marginTop: -40,
    color: '#4e4b51',
    fontWeight: '600',
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
  label: {
    fontSize: 16,
    marginVertical: 10,
    color: 'black',
  },
  picker: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fffff',
    marginBottom: 10,
    color: 'black',
    backgroundColor: '#ffffff',
    fontSize: 18,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loginsub: {
    textAlign: 'center',
    marginBottom: 10,
  },
  logAccount: {
    marginBottom: -40,
    marginTop: 15,
    textAlign: 'center',
    color: '#000',
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
  uploadButton: {
    backgroundColor: '#0077B5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: '19%',
  },
  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginVertical: 10,
    marginTop: -2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    color: '#000',
    fontSize: 16,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    maxHeight: 200,
    marginTop: 5,
    marginBottom: 5,
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  scrollView: {
    maxHeight: 150,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#888',
    padding: 10,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#007BFF',
    padding: 5,
    borderRadius: 5,
    width: 20,
    marginTop: -3,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default Edit;

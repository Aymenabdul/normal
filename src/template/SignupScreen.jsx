import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import UploadImage from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import env from './env';

const SignupScreen = () => {
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
  const [selectedCollege, setSelectedCollege] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [languages, setLanguages] = useState(['']);
  const navigation = useNavigation();
  const [base64Image, setBase64Image] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchText, setIndustrySearchText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState(null);
  const [selectRole, setSelectRole] = useState('');
  const [iscollege, setisCollege] = useState([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false); // New state for upload status
  const experienceOptions = [
    { label: '  0-1 years', value: '0-1' },
    { label: '  1-3 years', value: '1-3' },
    { label: '  3-5 years', value: '3-5' },
    { label: '  5-10 years', value: '5-10' },
    { label: '  10-15 years', value: '10-15' },
    { label: '  15+ years', value: '10+' },
  ];

  const fetchColleges = async (jobRole) => {
    console.log("Fetching colleges for job role:", jobRole);
    console.log(iscollege);


    try {
      setLoading(true);
      const response = await axios.get(`${env.baseURL}/api/auth/details/${jobRole}`);
      console.log("Response:", response.data); // This should show the expected data from the API

      // Update the state with the fetched college data
      setisCollege(response.data.colleges); // Assuming colleges is an array of objects
    } catch (error) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        Alert.alert("Error", error.response.data.message || "Failed to fetch colleges.");
      } else {
        console.error("Network Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };


  console.log(selectedRoleCode);
  console.log(selectedCollege);

  // Trigger the fetchColleges function when selectRole changes
  useEffect(() => {
    if (selectRole === 'placementDrive' || selectRole === 'Academy') {
      fetchColleges(selectRole);
    }
  }, [selectRole]);

  const filteredColleges = iscollege.filter(college =>
    college.college.toLowerCase().includes(searchText.toLowerCase()) // Access the 'college' field
  );

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



  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(100), (val, index) => currentYear - index);
  const addLanguageField = () => {
    if (languages.length < 3) {
      setLanguages([...languages, '']);
    }
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

    // Prepare the user data to send
    const userData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      jobOption,
      password,
      currentRole,
      keySkills,
      experience,
      industry,
      city,
      currentEmployer,
      college: selectedCollege,
      roleCode: selectedRoleCode,
      profilePic: base64Image || null,  // Ensure base64Image is either a valid string or null
    };

    setLoading(true);
    console.log("User Data being sent to the server:", userData);  // Check the data before sending

    try {
      const response = await axios.post(`${env.baseURL}/users`, userData, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Success handling
      Alert.alert(
        'Success',
        'Registration successful! Please check your email for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to LoginScreen and reset form fields
              navigation.navigate('LoginScreen');
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhoneNumber('');
              setJobOption('');
              setPassword('');
              setConfirmPassword('');
              setProfilePic(null);
              setCurrentRole('');
              setKeySkills('');
              setExperience('');
              setCity('');
              setIndustry('');
              setCurrentEmployer('');
              setisCollege('');
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        'Signup failed:',
        error.response ? error.response.data : error.message,
      );
      Alert.alert(
        'Signup failed',
        error.response ? error.response.data.message : error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const checkIfEmailExists = async (email) => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-email`,
        { email }, // Wrapping email in an object
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const checkIfPublicEmail = async () => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-Recruteremail`,
        { email },
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (response.data.error === 'Public email domains are not allowed') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking public email:', error);
      return false;
    }
  };

  const checkIfPhoneExists = async (phoneNumber) => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-phone`,
        phoneNumber,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
  };

  const handleProfilePic = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async response => {
      if (response.didCancel) {
        setIsImageUploaded(false); // Reset if canceled
      } else if (response.errorMessage) {
        console.error('ImagePicker error: ', response.errorMessage);
        setIsImageUploaded(false); // Reset on error
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        try {
          const base64String = await RNFS.readFile(imageUri, 'base64');
          const cleanBase64String = base64String.replace(
            /^data:image\/\w+;base64,/,
            '',
          );
          setBase64Image(cleanBase64String);
          setIsImageUploaded(true); // Set to true when image is successfully uploaded
        } catch (error) {
          console.error('Error converting image to Base64: ', error);
          setIsImageUploaded(false); // Reset on error
        }
      }
    });
  };

  return (
    <FastImage
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode={FastImage.resizeMode.cover}>
      {/* <Image style={styles.img} source={require('./assets/Png-02.png')} /> */}
      <LinearGradient colors={['#d3e4f6', '#a1d1ff']} style={styles.container}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.title}>SignUp</Text>
        {/* scrollView */}
        <ScrollView
          showsVerticalScrollIndicator={true}
          style={{ height: '40%', width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
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
            onValueChange={itemValue => setJobOption(itemValue)}>
            <Picker.Item
              style={{ fontSize: 16 }}
              label="  Scroll to select your role"
              value=""
            />
            <Picker.Item
              style={{ fontSize: 16 }}
              label="  Employer"
              value="Employer"
            />
            <Picker.Item
              style={{ fontSize: 16 }}
              label="  Freelancer"
              value="Freelancer"
            />
            <Picker.Item
              style={{ fontSize: 16 }}
              label="  Employee"
              value="Employee"
            />
            <Picker.Item
              style={{ fontSize: 16 }}
              label="  Entrepreneur"
              value="Entrepreneur"
            />
            <Picker.Item
              style={{ fontSize: 16 }}
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
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
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
          {jobOption === 'Freelancer' && (
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
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
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
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
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
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
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
            style={[
              styles.uploadButton,
              isImageUploaded && { backgroundColor: 'green' }, // Change color to green if uploaded
            ]}>
            <Text style={styles.uploadButtonText}>
              {isImageUploaded ? 'Image Uploaded' : 'Upload Profile Picture'}
            </Text>
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
              onPress={handleSignup}>
              <Text style={styles.signupButtonText}>SignUp</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Navigation to Login Screen */}
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.logAccount}>
            Already have an account? <Text style={{ color: 'blue' }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </FastImage >
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
    width: '90%',
    borderColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 60,
    borderRadius: 10,
    marginTop: -80,
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
    fontSize: 20,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
    color: 'black',
  },
  picker: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff', // Use a visible border color
    marginBottom: 10,
    color: 'black',
    backgroundColor: '#ffffff',
    fontSize: 20,
    height: 40, // Reduced height
    justifyContent: 'center', // Ensures content alignment
    borderRadius: 5, // Optional for rounded corners
    paddingHorizontal: 10, // Adjust spacing inside the picker
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
    fontSize: 17,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 150,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownOptionText: {
    color: '#333',
    fontSize: 20,
    fontWeight: '600',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#888',
    padding: 10,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 17,
  },
  removeButton: {
    backgroundColor: '#007BFF',
    padding: 7,
    borderRadius: 5,
    width: '25%',
    marginTop: -3,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignupScreen;

import React, { useEffect, useState } from 'react';
import {
    Image,
    TextInput,
    StyleSheet,
    Text,
    Alert,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import env from './env';

const PlacemenntSignup = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [jobRole, setJobRole] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [college, setCollege] = useState('');
    const navigation = useNavigation();
    const [branch, setBranch] = useState(''); // Renamed from city to branch

    useEffect(() => {
        Alert.alert(
            'Wezume',
            'please use your official email address.',
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
            { cancelable: false }
        );
    }, []);

    const validateInputs = () => {
        if (
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber ||
            !jobRole ||
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

        // Trim the password and confirmPassword to ensure no hidden spaces are causing a mismatch
        if (password.trim() !== confirmPassword.trim()) {
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
        console.log("Password:", password);
        console.log("Confirm Password:", confirmPassword);

        // Check if confirmPassword is empty
        if (!confirmPassword) {
            Alert.alert('Validation Error', 'Confirm Password cannot be empty!');
            return;
        }

        if (!validateInputs()) {
            return;
        }
        const userData = {
            firstName,
            lastName,
            email,
            phoneNumber,
            jobRole,
            password,
            branch,
            confirmPassword,
            college,
        };

        setLoading(true);
        try {
            const response = await axios.post(
                `${env.baseURL}/api/auth/signup`,
                userData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                }
            );
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
                            setJobRole('');
                            setPassword('');
                            setConfirmPassword('');
                            setBranch(''); // Reset branch as well
                            setCollege('');
                        },
                    },
                ]
            );
        } catch (error) {
            console.error(
                'Signup failed:',
                error.response ? error.response.data : error.message
            );
            Alert.alert(
                'Signup Error',
                error.response ? error.response.data : 'An unknown error occurred'
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <FastImage
            style={styles.backgroundImage}
            source={require('./assets/Background-01.jpg')}
            resizeMode={FastImage.resizeMode.cover}>
            <LinearGradient colors={['#d3e4f6', '#a1d1ff']} style={styles.container}>
                <Image style={styles.img2} source={require('./assets/logopng.png')} />
                <Text style={styles.title}>SignUp</Text>
                {/* scrollView */}
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    style={{ height: '40%', width: '100%' }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
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
                        selectedValue={jobRole}
                        style={styles.picker}
                        onValueChange={(itemValue) => setJobRole(itemValue)}>
                        <Picker.Item
                            style={{ fontSize: 16 }}
                            label="  Scroll to select your role"
                            value=""
                        />
                        <Picker.Item
                            style={{ fontSize: 16 }}
                            label="  Placement Officer"
                            value="placementDrive"
                        />
                        <Picker.Item
                            style={{ fontSize: 16 }}
                            label="  Academy Manager"
                            value="Academy"
                        />
                    </Picker>
                    {/* Changed the label and value to branch */}
                    <TextInput
                        style={styles.input}
                        placeholder="Branch"
                        placeholderTextColor="#000"
                        value={branch} // Changed from city to branch
                        onChangeText={setBranch}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="College or Academy Name"
                        placeholderTextColor="#000"
                        value={college}
                        onChangeText={setCollege}
                    />
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
                </ScrollView>
                {loading ? (
                    <ActivityIndicator size="large" color="#0077B5" style={styles.loadingIndicator} />
                ) : (
                    <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
                        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                            <Text style={styles.signupButtonText}>SignUp</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                )}

                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                    <Text style={styles.logAccount}>
                        Already have an account? <Text style={{ color: 'blue' }}>Login</Text>
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
    img2: {
        width: '100%',
        height: 100,
        marginTop: -60,
    },
    container: {
        width: '90%',
        borderColor: '#fff',
        borderWidth: 1,
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
    picker: {
        width: '100%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ffffff',
        marginBottom: 10,
        color: 'black',
        backgroundColor: '#ffffff',
        fontSize: 20,
        height: 40,
        justifyContent: 'center',
        borderRadius: 5,
        paddingHorizontal: 10,
    },
    loadingIndicator: {
        marginVertical: 20,
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
    logAccount: {
        marginBottom: -40,
        marginTop: 15,
        textAlign: 'center',
        color: '#000',
        fontSize: 17,
        fontWeight: '600',
    },
});

export default PlacemenntSignup;

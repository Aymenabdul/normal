import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Initial = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState(null); // To store all user session data

    console.log("Initial screen loaded");

    useEffect(() => {
        const loadDataFromStorage = async () => {
            try {
                // Retrieve user data from AsyncStorage
                const apiUserId = await AsyncStorage.getItem('userId');
                const apiRoleCode = await AsyncStorage.getItem('roleCode');
                const apiJobOption = await AsyncStorage.getItem('jobOption');
                const apiFirstName = await AsyncStorage.getItem('firstName');
                const apiCollege = await AsyncStorage.getItem('college');

                // If roleCode or userId is missing, navigate to Login screen
                if (!apiRoleCode || !apiUserId) {
                    console.log('No roleCode or userId found. Redirecting to Login');
                    navigation.navigate("LoginScreen");  // Navigate to login if roleCode or userId is missing
                    return;
                }

                // Check if essential data is found
                if (apiUserId && apiRoleCode) {
                    // Store data in state to use it for navigation
                    setUserData({
                        userId: apiUserId,
                        roleCode: apiRoleCode,
                        jobOption: apiJobOption,
                        firstName: apiFirstName,
                        college: apiCollege,
                    });
                    console.log('User session loaded from AsyncStorage:', { apiUserId, apiRoleCode });
                } else {
                    console.log('Incomplete session data. Redirecting to Login');
                    navigation.navigate("LoginScreen");  // Navigate to login if data is incomplete
                }
            } catch (error) {
                console.error('Error loading user data from AsyncStorage', error);
            }
        };

        loadDataFromStorage();
    }, [navigation]);

    useEffect(() => {
        // Check if user data is loaded
        if (userData) {
            const { jobOption, roleCode } = userData;

            // Check if roleCode is not null and navigate to RoleSelection
            if (roleCode) {
                navigation.navigate("RoleSelection");
            } else if (jobOption) {
                // Redirect based on the jobOption if it exists
                if (jobOption === 'Employee' || jobOption === 'Entrepreneur') {
                    navigation.navigate('home1');
                } else if (jobOption === 'Employer' || jobOption === 'Investor') {
                    navigation.navigate('HomeScreen');
                } else {
                    navigation.navigate("OnboardingScreen");
                }
            } else {
                // If jobOption is missing, navigate to Login screen
                navigation.navigate("LoginScreen");
            }
        }
    }, [userData, navigation]); // Watch for changes in userData

    return null;  // No UI since this screen handles navigation logic
};

export default Initial;

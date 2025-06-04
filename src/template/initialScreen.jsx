import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Initial = () => {
    const navigation = useNavigation();
    const [jobOption, setJobOption] = useState();

    console.log("Initial screen loaded");
    console.log("Job option:", jobOption);

    useEffect(() => {
        const loadDataFromStorage = async () => {
            try {
                const apiJobOption = await AsyncStorage.getItem('jobOption');
                setJobOption(apiJobOption);
            } catch (error) {
                console.error('Error loading user data from AsyncStorage', error);
            }
        };

        loadDataFromStorage();
    }, []);

    useEffect(() => {
        if (jobOption !== undefined) {
            if (jobOption === 'Employee' || jobOption === 'Entrepreneur') {
                navigation.navigate('home1');
            } else if (jobOption === 'Employer' || jobOption === 'Investor') {
                navigation.navigate('HomeScreen');
            } else {
                navigation.navigate("OnboardingScreen");
            }
        }
    }, [jobOption]); // Now it watches jobOption instead of navigation

    return null;
};

export default Initial;

import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Initial = () => {
    const navigation = useNavigation();
   console.log("initial running")
    useEffect(() => {
        const checkJobOption = async () => {
            try {
                const jobOption = await AsyncStorage.getItem('jobOption');
                console.log(jobOption,"jobOption")
                if (jobOption) {
                    if (jobOption === 'Employee' || jobOption === 'Entrepreneur' || jobOption === "Freelancer") {
                        navigation.navigate('home1');
                    } else if (jobOption === 'Employer' || jobOption === 'Investor') {
                        navigation.navigate('HomeScreen');
                    }
                } else {
                    navigation.navigate("OnboardingScreen");
                }
            } catch (error) {
                console.error('Error retrieving jobOption:', error);
            }
        };

        checkJobOption();
    }, [navigation]);

    return null; // No UI to render
};

export default Initial;

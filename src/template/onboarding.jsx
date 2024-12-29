import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import FastImage from 'react-native-fast-image';

const OnboardingScreen = ({ navigation }) => {
  useEffect(() => {
    // Automatically navigate to the LoginScreen after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('LoginScreen');
    }, 4000);

    // Clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <FastImage
      source={require('./assets/login.jpg')} // Replace with your background image path
      style={styles.backgroundImage} // Add style for the background image
    >
      <Onboarding
        showSkip={false} // Hide the Skip button
        showDone={false} // Hide the Done button
        pages={[
          {
            backgroundColor: 'transparent', // Make it transparent to show the background image
            image: <FastImage source={require('./assets/logo.gif')} style={styles.image} />,
            title: <Text style={styles.Text}>wezume</Text>,
            subtitle: 'Connect, create, and grow with video. Build your professional identity, one video at a time.',
          },
        ]}
      />
    </FastImage>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
  },
  Text: {
    color: 'white',
    fontSize: 40,
    fontWeight: '600',
    marginTop: -40,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default OnboardingScreen;

import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const AppUpdateChecker = () => {
  useEffect(() => {
    const checkAppUpdate = async () => {
      const currentVersion = DeviceInfo.getVersion(); // e.g., "1.0.1"
      const storedVersion = await AsyncStorage.getItem('appVersion');

      

      if (storedVersion !== currentVersion) {
        // App has been updated
        await clearVideoCache();
        await AsyncStorage.setItem('appVersion', currentVersion);
        console.log('🆕 App updated. Cache cleared.');
      } else {
        console.log('📲 App version unchanged.');
      }
    };

    checkAppUpdate();
  }, []);

  const clearVideoCache = async () => {
    try {
      await AsyncStorage.removeItem('cachedVideos');
      console.log('✅ Video cache cleared!');
    } catch (error) {
      console.error('❌ Failed to clear video cache:', error);
    }
  };

  return null; // This component doesn't render anything
};

export default AppUpdateChecker;

/**
 * @format
 */

import {AppRegistry} from 'react-native';
// import vprofile from './vprofile'; // Import your component
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';


AppRegistry.registerComponent(appName, () => App);

import './require-shim.js';
import './fonts.css';
// store -> auth reducer -> utils/api -> store is a circular import. Metro
// tolerates it through lazy requires; in a bundled ES build the store has to be
// evaluated first or the auth reducer is still uninitialised when it is used.
import '../src_new/redux/store';
import {AppRegistry, Image} from 'react-native';
import App from '../App.jsx';

// react-native-web has no Image.resolveAssetSource; bundled images are already
// {uri, width, height} objects (see rn-require-assets in vite.config.web.js).
if (!Image.resolveAssetSource) {
  Image.resolveAssetSource = source =>
    typeof source === 'string' ? {uri: source} : source;
}

AppRegistry.registerComponent('amaraa', () => App);
AppRegistry.runApplication('amaraa', {
  rootTag: document.getElementById('app'),
});

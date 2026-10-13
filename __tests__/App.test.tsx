/**
 * @format
 */

import 'react-native';
import App from '../App.jsx';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

it('loads the app component', () => {
  expect(App).toBeDefined();
});

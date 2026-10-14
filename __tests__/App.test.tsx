/**
 * @format
 */

import 'react-native';
import App from '../App.jsx';
import NewFlowApp from '../src_new/App.jsx';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

it('launches the new flow from the registered app entry point', () => {
  expect(App).toBe(NewFlowApp);
});

/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {Alert} from 'react-native';
import {
  check,
  checkNotifications,
  openSettings,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import SettingsModal from '../components/main/SettingsModal';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
let renderer;
const callbacks = {
  onClose: jest.fn(),
  onLogout: jest.fn(),
  onDelete: jest.fn(),
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  check.mockResolvedValue(RESULTS.GRANTED);
  checkNotifications.mockResolvedValue({status: RESULTS.DENIED});
  openSettings.mockResolvedValue();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  if (renderer) {
    act(() => renderer.unmount());
  }
  jest.restoreAllMocks();
});
async function mount() {
  await act(async () => {
    renderer = create(<SettingsModal visible {...callbacks} />);
  });
}
test('shows current permissions and opens device settings when disabling location', async () => {
  await mount();
  const location = renderer.root.findByProps({accessibilityLabel: 'Location'});
  expect(location.props.accessibilityState.checked).toBe(true);
  await act(async () => {
    await location.props.onPress();
  });
  expect(openSettings).toHaveBeenCalledWith('application');
});
test('requests notifications and refreshes the switch from the OS result', async () => {
  checkNotifications
    .mockResolvedValueOnce({status: RESULTS.DENIED})
    .mockResolvedValue({status: RESULTS.GRANTED});
  requestNotifications.mockResolvedValue({status: RESULTS.GRANTED});
  await mount();
  await act(async () => {
    await renderer.root
      .findByProps({accessibilityLabel: 'Notifications'})
      .props.onPress();
  });
  expect(requestNotifications).toHaveBeenCalledWith([
    'alert',
    'sound',
    'badge',
  ]);
  expect(
    renderer.root.findByProps({accessibilityLabel: 'Notifications'}).props
      .accessibilityState.checked,
  ).toBe(true);
});
test('requires explicit confirmation before calling account deletion', async () => {
  await mount();
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Delete account'})
      .props.onPress(),
  );
  expect(callbacks.onDelete).not.toHaveBeenCalled();
  const buttons = Alert.alert.mock.calls[0][2];
  expect(buttons[0].style).toBe('cancel');
  await act(async () => {
    await buttons[1].onPress();
  });
  expect(callbacks.onDelete).toHaveBeenCalledTimes(1);
});

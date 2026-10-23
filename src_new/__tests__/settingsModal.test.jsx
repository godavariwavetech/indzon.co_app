/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {
  check,
  checkNotifications,
  openSettings,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import SettingsModal from '../components/main/SettingsModal';
import ConfirmDialog from '../components/main/ConfirmDialog';

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
  const dialog = renderer.root
    .findAllByType(ConfirmDialog)
    .find(item => item.props.visible && item.props.danger);
  expect(dialog.props.title).toBe('Delete account?');
  await act(async () => {
    await dialog.props.onConfirm();
  });
  expect(callbacks.onDelete).toHaveBeenCalledTimes(1);
});

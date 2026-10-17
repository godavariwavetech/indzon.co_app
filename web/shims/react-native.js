// react-native-web, with Dimensions / useWindowDimensions reporting the width
// of the phone-sized column the app is rendered in (see #app in index.html)
// instead of the whole browser window. Screens size banners, cards and grids
// from the window width, so on a desktop browser they would otherwise lay
// themselves out for 1400px and overflow the visible column.
import {useEffect, useState} from 'react';
import {Dimensions as RNWDimensions} from 'react-native-web';

export * from 'react-native-web';

const MAX_WIDTH = 480;

const metrics = () => {
  const width = Math.min(window.innerWidth, MAX_WIDTH);
  const height = window.innerHeight;
  return {width, height, scale: window.devicePixelRatio || 1, fontScale: 1};
};

export const Dimensions = {
  get(dimension) {
    if (dimension === 'window' || dimension === 'screen') {
      return metrics();
    }
    return RNWDimensions.get(dimension);
  },
  set: (...args) => RNWDimensions.set(...args),
  addEventListener(type, handler) {
    if (type !== 'change') {
      return RNWDimensions.addEventListener(type, handler);
    }
    const listener = () => handler({window: metrics(), screen: metrics()});
    window.addEventListener('resize', listener);
    window.addEventListener('orientationchange', listener);
    return {
      remove() {
        window.removeEventListener('resize', listener);
        window.removeEventListener('orientationchange', listener);
      },
    };
  },
};

export function useWindowDimensions() {
  const [size, setSize] = useState(metrics);
  useEffect(() => {
    const update = () => setSize(metrics());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return size;
}

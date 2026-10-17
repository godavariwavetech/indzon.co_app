// React Navigation calls require() for optional peer modules inside ESM files,
// which bundlers leave untouched. Provide a minimal global require: the safe
// area module is real, and the optional native ones (react-native-screens,
// reanimated) throw, which React Navigation already handles by falling back to
// plain views.
import * as safeArea from 'react-native-safe-area-context';

const modules = {'react-native-safe-area-context': safeArea};

globalThis.require = name => {
  if (modules[name]) {
    return modules[name];
  }
  throw new Error(`Cannot find module '${name}'`);
};

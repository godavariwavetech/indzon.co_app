// Static web build of the app (react-native-web). Native-only modules are
// replaced by browser stand-ins from web/shims.
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {transformWithEsbuild} from 'vite';

const shim = name => path.resolve(__dirname, 'web/shims', name);
const extensions = [
  '.web.js',
  '.web.jsx',
  '.web.ts',
  '.web.tsx',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
];


// React Native loads bundled images with require('./pic.png'). Turn those into
// imports and keep the pixel size, because RN code reads width/height from the
// required asset (Image.resolveAssetSource).
function imageSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return {width: buf.readUInt32BE(16), height: buf.readUInt32BE(20)};
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7)};
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return {width: 0, height: 0};
}
const requireAssets = {
  name: 'rn-require-assets',
  enforce: 'pre',
  transform(code, id) {
    const clean = id.split('?')[0];
    if (clean.includes('/node_modules/') || !/\.(jsx?|tsx?)$/.test(clean)) {
      return null;
    }
    const pattern = /require\((['"])(\.{1,2}\/[^'"]+\.(?:png|jpe?g|gif|webp))\1\)/g;
    if (!pattern.test(code)) {
      return null;
    }
    pattern.lastIndex = 0;
    const imports = [];
    const out = code.replace(pattern, (_, __, rel) => {
      const name = `__asset${imports.length}`;
      const {width, height} = imageSize(path.resolve(path.dirname(clean), rel));
      imports.push(`import ${name} from '${rel}';`);
      return `{uri: ${name}, width: ${width}, height: ${height}}`;
    });
    return {code: `${imports.join('\n')}\n${out}`, map: null};
  },
};

// Some React Native libraries publish JSX inside plain .js files. Rollup cannot
// parse that, so run those packages through esbuild's JSX loader first.
const jsxPackages = ['react-native-shadow-2'];
const jsxInNodeModules = {
  name: 'jsx-in-node-modules',
  enforce: 'pre',
  async transform(code, id) {
    const clean = id.split('?')[0];
    if (
      !clean.endsWith('.js') ||
      !jsxPackages.some(pkg => clean.includes(`/node_modules/${pkg}/`))
    ) {
      return null;
    }
    return transformWithEsbuild(code, clean, {loader: 'jsx', jsx: 'automatic'});
  },
};

export default defineConfig({
  root: path.resolve(__dirname, 'web'),
  // Relative asset paths so the build works from any sub-path (GitHub Pages).
  base: './',
  plugins: [requireAssets, jsxInNodeModules, react({include: /\.(jsx?|tsx?)$/})],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
  },
  resolve: {
    extensions,
    alias: [
      {find: /^react-native$/, replacement: shim('react-native.js')},
      {
        find: /^(\.\.\/)+src\/navigation\/RentalNavigation$/,
        replacement: shim('legacy-navigation.js'),
      },
      {
        find: 'react-native-vector-icons/MaterialIcons',
        replacement: shim('MaterialIcons.jsx'),
      },
      {
        find: 'react-native-vector-icons/FontAwesome',
        replacement: shim('FontAwesome.jsx'),
      },
      {
        find: 'react-native-linear-gradient',
        replacement: shim('linear-gradient.jsx'),
      },
      {
        find: 'react-native-permissions',
        replacement: shim('permissions.js'),
      },
      {
        find: 'react-native-geolocation-service',
        replacement: shim('geolocation.js'),
      },
      {
        find: 'react-native-splash-screen',
        replacement: shim('splash-screen.js'),
      },
      {find: 'react-native-restart', replacement: shim('restart.js')},
      {
        find: '@react-native-firebase/messaging',
        replacement: shim('firebase-messaging.js'),
      },
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      loader: {'.js': 'jsx'},
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
  },
  server: {host: true, port: 5173},
});

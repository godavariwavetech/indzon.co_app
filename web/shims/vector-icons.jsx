// react-native-vector-icons for the web: loads the bundled TTF with @font-face
// and renders the glyph as text.
import React from 'react';
import {Text} from 'react-native';
import materialGlyphs from 'react-native-vector-icons/glyphmaps/MaterialIcons.json';
import materialFont from 'react-native-vector-icons/Fonts/MaterialIcons.ttf?url';
import fontAwesomeGlyphs from 'react-native-vector-icons/glyphmaps/FontAwesome.json';
import fontAwesomeFont from 'react-native-vector-icons/Fonts/FontAwesome.ttf?url';

const installed = new Set();
function installFont(family, url) {
  if (installed.has(family) || typeof document === 'undefined') {
    return;
  }
  installed.add(family);
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'${family}';src:url('${url}') format('truetype');font-display:block;}`;
  document.head.appendChild(style);
}

function createIconSet(family, glyphs, url) {
  installFont(family, url);
  return function Icon({name, size = 12, color, style, ...rest}) {
    const code = glyphs[name];
    const char = code ? String.fromCodePoint(code) : '?';
    return (
      <Text
        {...rest}
        selectable={false}
        style={[
          {
            fontFamily: family,
            fontSize: size,
            color,
            fontWeight: 'normal',
            fontStyle: 'normal',
          },
          style,
        ]}>
        {char}
      </Text>
    );
  };
}

export const MaterialIcons = createIconSet(
  'MaterialIcons',
  materialGlyphs,
  materialFont,
);
export const FontAwesome = createIconSet(
  'FontAwesome',
  fontAwesomeGlyphs,
  fontAwesomeFont,
);

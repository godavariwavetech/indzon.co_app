const inlineGoogleMapsApiKey = ({ types }) => ({
  visitor: {
    MemberExpression(path) {
      const { object, property } = path.node;
      const isEnvironmentVariable =
        property.type === 'Identifier' &&
        property.name === 'GOOGLE_MAPS_API_KEY' &&
        object.type === 'MemberExpression' &&
        object.object.type === 'Identifier' &&
        object.object.name === 'process' &&
        object.property.type === 'Identifier' &&
        object.property.name === 'env';

      if (isEnvironmentVariable) {
        path.replaceWith(
          types.stringLiteral(process.env.GOOGLE_MAPS_API_KEY || ''),
        );
      }
    },
  },
});

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [inlineGoogleMapsApiKey],
};

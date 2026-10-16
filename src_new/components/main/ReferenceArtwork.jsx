import React from 'react';
import {StyleSheet, View} from 'react-native';
import {LoadingImage} from './Skeleton';

// All artwork is bundled separately from the interactive screen components.
function ReferenceArtwork({
  art,
  width,
  height,
  style,
  resizeMode,
}) {
  const cellSize = Math.min(width, height);
  const sprite = art.sprite;
  if (sprite) {
    return (
      <View pointerEvents="none" accessible={false} style={[{width, height, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}, style]}>
        <View style={{width: cellSize, height: cellSize, overflow: 'hidden'}}>
          <LoadingImage
            source={art.source}
            style={{position: 'absolute', width: cellSize * sprite.columns, height: cellSize * sprite.rows, left: -sprite.column * cellSize, top: -sprite.row * cellSize}}
            resizeMode="stretch"
            fadeDuration={0}
            accessible={false}
          />
        </View>
      </View>
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[{width, height, overflow: 'hidden'}, style]}
      accessible={false}>
      {art.background ? (
        <LoadingImage
          source={art.background}
          style={[StyleSheet.absoluteFillObject, {width, height}]}
          resizeMode="stretch"
          fadeDuration={0}
          resizeMethod="auto"
          accessible={false}
        />
      ) : null}
      <LoadingImage
        source={art.source}
        style={[
          StyleSheet.absoluteFillObject,
          {width, height, borderRadius: art.borderRadius || 0},
        ]}
        resizeMode={
          resizeMode ||
          art.resizeMode ||
          (art.borderRadius ? 'cover' : 'contain')
        }
        fadeDuration={0}
        resizeMethod="auto"
        accessible={false}
      />
    </View>
  );
}
export default React.memo(ReferenceArtwork);

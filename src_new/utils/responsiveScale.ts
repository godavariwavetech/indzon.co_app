import {Dimensions, PixelRatio} from 'react-native';

let screenWidth = Dimensions.get("screen").width;
let screenHeight = Dimensions.get("screen").height;

const getWidth: (widthPercent: string | number) => number = widthPercent => {
  const elemWidth =
    typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

const getHeigth: (heightPercent: string | number) => number = heightPercent => {
  const elemHeight =
    typeof heightPercent === 'number'
      ? heightPercent
      : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};

export const getFontSize = (fontSize: number) => {
  const widthDimension =
    screenHeight > screenWidth ? screenWidth : screenHeight;
  const aspectRatioBasedHeight = (16 / 9) * widthDimension;
  return (
    (Math.sqrt(
      Math.pow(aspectRatioBasedHeight, 2) + Math.pow(widthDimension, 2),
    ) *
      (fontSize / 100)) /
    2
  );
};

let subscribe: any;
const listenOrientationChange = (that: any) => {
  let subscribe = Dimensions.addEventListener('change', newDimensions => {
    screenWidth = newDimensions.window.width;
    screenHeight = newDimensions.window.height;

    that.setState({
      orientation: screenWidth < screenHeight ? 'portrait' : 'landscape',
    });
  });
};

const removeOrientationListener = () => {
  subscribe.remove();
};

export {
  getWidth,
  getHeigth,
  listenOrientationChange,
  removeOrientationListener,
};

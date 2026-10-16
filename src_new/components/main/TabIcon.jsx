import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export default function TabIcon({name, focused, color, size = 28}) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {name === 'home' ? (
        <Path
          d="M3 12.5 14 3l11 9.5-2 1.7V25h-6v-8h-6v8H5V14.2Z"
          {...stroke}
          fill={focused ? color : 'none'}
        />
      ) : null}
      {name === 'categories' ? (
        <>
          <Rect
            x={3}
            y={3}
            width={8}
            height={8}
            rx={2}
            {...stroke}
            fill={focused ? color : 'none'}
          />
          <Rect
            x={17}
            y={3}
            width={8}
            height={8}
            rx={2}
            {...stroke}
            fill={focused ? color : 'none'}
          />
          <Rect
            x={3}
            y={17}
            width={8}
            height={8}
            rx={2}
            {...stroke}
            fill={focused ? color : 'none'}
          />
          <Path
            d="m21 15 6 6-6 6-6-6Z"
            {...stroke}
            fill={focused ? color : 'none'}
          />
        </>
      ) : null}
      {name === 'orders' ? (
        <>
          <Path
            d="M8 8V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3M6 8h16l2 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2L5 9Z"
            {...stroke}
            fill={focused ? color : 'none'}
          />
          <Circle
            cx={17}
            cy={18}
            r={6}
            fill={focused ? '#FFFFFF' : '#FFFFFF'}
            {...stroke}
          />
          <Path d="m14 18 2 2 4-4" {...stroke} />
        </>
      ) : null}
      {name === 'profile' ? (
        <>
          <Circle
            cx={14}
            cy={8}
            r={5}
            {...stroke}
            fill={focused ? color : 'none'}
          />
          <Path
            d="M9 15c3 3 7 3 10 0 4 2 5 5 5 9-6 3-14 3-20 0 0-4 1-7 5-9Z"
            {...stroke}
            fill={focused ? color : 'none'}
          />
        </>
      ) : null}
    </Svg>
  );
}

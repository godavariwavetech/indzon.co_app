import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';

import {LOGIN_DESIGN_HEIGHT} from '../../config/login';

export interface LoginBackgroundProps {
  width: number;
  height: number;
  /** screenWidth / LOGIN_DESIGN_WIDTH */
  scale: number;
}

/**
 * Decorative circles, rings and dots behind the sign-in screen.
 *
 * The top-right group is anchored to the top edge and the bottom-left group
 * to the bottom edge, both measured on the 360 × 780 design frame.
 */
export function LoginBackground({width, height, scale}: LoginBackgroundProps) {
  const top = (v: number) => v * scale;
  const bottom = (v: number) => height - (LOGIN_DESIGN_HEIGHT - v) * scale;
  const x = (v: number) => v * scale;
  const r = (v: number) => v * scale;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none">
      <Defs>
        <LinearGradient
          id="loginTopCircle"
          gradientUnits="userSpaceOnUse"
          x1={x(300)}
          y1={top(0)}
          x2={x(360)}
          y2={top(173)}>
          <Stop offset="0" stopColor="#9AD7E0" />
          <Stop offset="1" stopColor="#44B0C0" />
        </LinearGradient>
        <LinearGradient
          id="loginBottomCircle"
          gradientUnits="userSpaceOnUse"
          x1={x(0)}
          y1={bottom(665)}
          x2={x(110)}
          y2={bottom(780)}>
          <Stop offset="0" stopColor="#98D3DC" />
          <Stop offset="1" stopColor="#CBEBF0" />
        </LinearGradient>
      </Defs>

      {/* Top-right */}
      <Circle cx={x(325)} cy={top(140)} r={r(69)} fill="#F3FAFB" />
      <Circle cx={x(436)} cy={top(37)} r={r(136)} fill="url(#loginTopCircle)" />
      <Circle
        cx={x(367)}
        cy={top(7)}
        r={r(138)}
        stroke="#0096A1"
        strokeOpacity={0.4}
        strokeWidth={Math.max(1, scale)}
        fill="none"
      />
      <Circle cx={x(253.4)} cy={top(83.7)} r={r(10.3)} fill="#4DB3C3" />

      {/* Bottom-left */}
      <Circle cx={x(362)} cy={bottom(727)} r={r(53)} fill="#F8FCFD" />
      <Circle cx={x(42)} cy={bottom(790)} r={r(129)} fill="#F8FCFD" />
      <Circle
        cx={x(-4)}
        cy={bottom(779)}
        r={r(114)}
        fill="url(#loginBottomCircle)"
      />
      <Circle
        cx={x(110)}
        cy={bottom(792)}
        r={r(96)}
        stroke="#0096A1"
        strokeOpacity={0.12}
        strokeWidth={Math.max(1, scale)}
        fill="none"
      />
      <Circle cx={x(164)} cy={bottom(710)} r={r(12)} fill="#97D3DB" />
    </Svg>
  );
}

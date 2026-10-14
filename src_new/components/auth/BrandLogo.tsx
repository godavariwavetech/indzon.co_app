import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
  Text,
  TSpan,
} from 'react-native-svg';

import {loginLayout} from '../../config/login';

export interface BrandLogoProps {
  width: number;
  height: number;
}

const {logoLeft, logoTop, logoWidth, logoHeight} = loginLayout;

/**
 * Godavari Wave Technologies logo, traced from the sign-in design.
 *
 * Drawn on the design frame's own coordinates (viewBox) so it lines up with
 * the rest of the screen. Swap for the exported brand asset when available,
 * keeping the same frame.
 */
export function BrandLogo({width, height}: BrandLogoProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${logoLeft} ${logoTop} ${logoWidth} ${logoHeight}`}
      accessibilityRole="image"
      accessibilityLabel="Godavari Wave Technologies Pvt Ltd.">
      <Defs>
        <LinearGradient
          id="logoRim"
          gradientUnits="userSpaceOnUse"
          x1="470"
          y1="30"
          x2="80"
          y2="460">
          <Stop offset="0" stopColor="#86D0F2" />
          <Stop offset="0.5" stopColor="#5F95D8" />
          <Stop offset="1" stopColor="#5364BE" />
        </LinearGradient>
        <LinearGradient
          id="logoCrest"
          gradientUnits="userSpaceOnUse"
          x1="105"
          y1="300"
          x2="540"
          y2="320">
          <Stop offset="0" stopColor="#1F4FAE" />
          <Stop offset="1" stopColor="#3A7BCD" />
        </LinearGradient>
        <LinearGradient
          id="logoBody"
          gradientUnits="userSpaceOnUse"
          x1="200"
          y1="380"
          x2="460"
          y2="540">
          <Stop offset="0" stopColor="#3D74C9" />
          <Stop offset="1" stopColor="#7CC6EF" />
        </LinearGradient>
      </Defs>

      {/* Emblem, authored in a 540 × 540 box */}
      <G transform="translate(57.3 89.4) scale(0.093 0.0967)">
        <Circle cx="270" cy="270" r="270" fill="url(#logoRim)" />
        {/* Open interior of the ring, ending in the teardrop */}
        <Path
          d="M90 280 C90 180 160 122 235 122 C300 122 335 160 340 205 C345 245 360 268 400 276 C350 262 300 225 240 225 C175 225 120 265 105 310 C95 300 90 290 90 280 Z"
          fill="#FFFFFF"
        />
        {/* Background showing between the teardrop and the rim */}
        <Path
          d="M470 90 C515 150 520 250 430 282 L545 302 L545 90 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M150 400 C220 410 290 372 360 362 C430 352 490 360 535 345 A270 270 0 0 1 270 540 C220 540 175 520 150 490 Z"
          fill="url(#logoBody)"
        />
        <Path
          d="M105 310 C120 265 175 225 240 225 C300 225 350 262 400 278 C450 292 500 300 540 300 L545 320 L520 330 L535 345 C480 360 420 362 360 350 C320 342 290 345 265 360 C235 378 200 390 170 380 C135 370 110 345 105 310 Z"
          fill="url(#logoCrest)"
        />
        <Ellipse
          cx="178"
          cy="338"
          rx="42"
          ry="17"
          fill="#FFFFFF"
          opacity={0.9}
          transform="rotate(-10 178 338)"
        />
        <Ellipse
          cx="125"
          cy="318"
          rx="22"
          ry="11"
          fill="#1F4FAE"
          transform="rotate(-20 125 318)"
        />
      </G>

      <Text
        x="117.5"
        y="118.7"
        fontSize="21.5"
        fontWeight="600"
        letterSpacing="0.4">
        <TSpan fill="#5C9AD6">GODAVARI </TSpan>
        <TSpan fill="#3A63B3" fontWeight="700">
          WAVE
        </TSpan>
      </Text>
      <Text
        x="119.8"
        y="132.4"
        fontSize="12"
        fontWeight="500"
        fill="#6E6E6E"
        letterSpacing="2.1">
        TECHNOLOGIES Pvt Ltd.
      </Text>
    </Svg>
  );
}

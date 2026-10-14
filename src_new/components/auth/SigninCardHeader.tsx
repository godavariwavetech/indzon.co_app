import React from 'react';
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  G,
  Path,
} from 'react-native-svg';

import {loginColors, loginLayout, LOGIN_DESIGN_WIDTH} from '../../config/login';

export interface SigninCardHeaderProps {
  width: number;
  height: number;
}

const {
  cardCanvasTop,
  cardCanvasHeight,
  cardTop,
  cardCornerRadius,
  humpRadius,
  humpFilletRadius,
  badgeCenterY,
  badgeRadius,
  badgeIconSize,
} = loginLayout;

/**
 * Card outline: flat top edge with a centred semicircular hump blended in by
 * concave fillets. Built from the design frame numbers so the geometry stays
 * exact at any scale.
 */
function buildCardPath() {
  const cx = LOGIN_DESIGN_WIDTH / 2;
  const R = humpRadius;
  const f = humpFilletRadius;
  // Fillet circle sits on the top edge, externally tangent to the hump.
  const dx = Math.sqrt((R + f) ** 2 - f ** 2);
  const t = R / (R + f);
  const humpLeftX = cx - dx * t;
  const humpRightX = cx + dx * t;
  const humpY = cardTop - f * t;
  const bottom = cardCanvasTop + cardCanvasHeight;
  const W = LOGIN_DESIGN_WIDTH;
  const cr = cardCornerRadius;

  return [
    `M0 ${bottom}`,
    `L0 ${cardTop + cr}`,
    `Q0 ${cardTop} ${cr} ${cardTop}`,
    `L${cx - dx} ${cardTop}`,
    `A${f} ${f} 0 0 0 ${humpLeftX} ${humpY}`,
    `A${R} ${R} 0 0 1 ${humpRightX} ${humpY}`,
    `A${f} ${f} 0 0 0 ${cx + dx} ${cardTop}`,
    `L${W - cr} ${cardTop}`,
    `Q${W} ${cardTop} ${W} ${cardTop + cr}`,
    `L${W} ${bottom}`,
    'Z',
  ].join(' ');
}

const CARD_PATH = buildCardPath();

// lucide "shield-check" (24 × 24)
const SHIELD_PATH =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z';
const CHECK_PATH = 'm9 12 2 2 4-4';

/** Top of the sign-in card: hump outline with its soft shadow and the badge. */
export function SigninCardHeader({width, height}: SigninCardHeaderProps) {
  const iconScale = badgeIconSize / 24;
  const iconX = LOGIN_DESIGN_WIDTH / 2 - badgeIconSize / 2;
  const iconY = badgeCenterY - badgeIconSize / 2;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 ${cardCanvasTop} ${LOGIN_DESIGN_WIDTH} ${cardCanvasHeight}`}
      pointerEvents="none">
      <Defs>
        <Filter id="cardShadow" x="-10%" y="-50%" width="120%" height="200%">
          <FeGaussianBlur stdDeviation={5} />
        </Filter>
      </Defs>
      <G filter="url(#cardShadow)">
        <Path
          d={CARD_PATH}
          fill={loginColors.cardShadow}
          opacity={0.12}
          transform="translate(0 -2)"
        />
      </G>
      <Path d={CARD_PATH} fill={loginColors.background} />

      <Circle
        cx={LOGIN_DESIGN_WIDTH / 2}
        cy={badgeCenterY}
        r={badgeRadius}
        fill={loginColors.brand}
      />
      <G
        transform={`translate(${iconX} ${iconY}) scale(${iconScale})`}
        fill="none"
        stroke={loginColors.background}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round">
        <Path d={SHIELD_PATH} />
        <Path d={CHECK_PATH} />
      </G>
    </Svg>
  );
}

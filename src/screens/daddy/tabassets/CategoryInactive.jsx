// import * as React from "react"
// import Svg, { Path } from "react-native-svg"

// function CategoryInactive({ color = "#525252", ...props }) {
//   return (
//     <Svg
//       xmlns="http://www.w3.org/2000/svg"
//       width={24}
//       height={24}
//       viewBox="0 0 24 24"
//       fill="none"
//       {...props}
//     >
//       <Path
//         d="M2.33 4.25A2.25 2.25 0 014.58 2h4.17A2.25 2.25 0 0111 4.25v2.17a2.25 2.25 0 01-2.25 2.25H4.58a2.25 2.25 0 01-2.25-2.25V4.25zM13.67 4.25A2.25 2.25 0 0115.92 2h3.5a2.25 2.25 0 012.25 2.25v6.83a2.25 2.25 0 01-2.25 2.25h-3.5a2.25 2.25 0 01-2.25-2.25V4.25zM13.67 18.25A2.25 2.25 0 0115.92 16h3.5a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 0119.42 22h-3.5a2.25 2.25 0 01-2.25-2.25v-1.5zM2.33 13.58a2.25 2.25 0 012.25-2.25h4.17A2.25 2.25 0 0111 13.58v6.17A2.25 2.25 0 018.75 22H4.58a2.25 2.25 0 01-2.25-2.25v-6.17z"
//         fill={color}
//       />
//     </Svg>
//   )
// }

// export default CategoryInactive





import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function CategoryInactive({ color = "#525252", ...props }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0_1_17234)" fill={color}>
        <Path d="M19.167 10.816H.833a.834.834 0 010-1.667h18.334a.834.834 0 010 1.667zM19.167 4.427H.833a.834.834 0 010-1.667h18.334a.834.834 0 010 1.667zM19.167 17.205H.833a.834.834 0 010-1.667h18.334a.834.834 0 010 1.667z" />
      </G>
      <Defs>
        <ClipPath id="clip0_1_17234">
          <Path fill={color} d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default CategoryInactive

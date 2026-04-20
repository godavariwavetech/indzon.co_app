// import * as React from "react"
// import Svg, { Path } from "react-native-svg"

// function CartInactive({ color = "#525252", ...props }) {
//   return (
//     <Svg
//       xmlns="http://www.w3.org/2000/svg"
//       width={25}
//       height={24}
//       viewBox="0 0 25 24"
//       fill="none"
//       {...props}
//     >
//       <Path
//         fillRule="evenodd"
//         clipRule="evenodd"
//         d="M21.34 6.86l1.26 8.34c.51 3.65-2 6.97-5.4 7H7.94c-3.34 0-5.88-3.35-5.34-7l1.26-8.34a5.61 5.61 0 015.34-5H16a5.61 5.61 0 015.34 5zM8.7 7.81a3.91 3.91 0 003.9 3.9 3.91 3.91 0 003.9-3.9.75.75 0 00-1.5 0 2.4 2.4 0 01-4.8 0 .75.75 0 00-1.5 0z"
//         fill={color}
//       />
//     </Svg>
//   )
// }

// export default CartInactive




import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function CartInactive({ color = "#525252", ...props }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0_1_17272)">
        <Path
          d="M19.876 5.246a.586.586 0 00-.462-.225H4.809l-.535-2.142A3.796 3.796 0 00.586 0a.586.586 0 000 1.172c1.209 0 2.258.819 2.55 1.991l2.114 8.453c.16.643.537 1.186 1.04 1.56-1.006.954-.78 2.703.413 3.383-1.058 1.383-.028 3.457 1.728 3.44 1.589.022 2.661-1.742 1.917-3.137h3.07c-.744 1.395.328 3.16 1.917 3.138 2.854-.108 2.854-4.202 0-4.31H7.803c-1.302-.05-1.301-1.917 0-1.966h8.013c1.28 0 2.39-.867 2.7-2.108l1.466-5.867a.586.586 0 00-.106-.503zm-4.541 11.616c.542 0 .983.44.983.983-.05 1.302-1.917 1.302-1.967 0 0-.542.442-.983.984-.983zm-6.904 0c.542 0 .983.44.983.983-.05 1.302-1.917 1.302-1.966 0 0-.542.441-.983.983-.983zm8.948-5.53a1.608 1.608 0 01-1.563 1.22H7.95c-.74 0-1.383-.502-1.562-1.22l-1.285-5.14h13.562l-1.285 5.14z"
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_1_17272">
          <Path fill="#fff" d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default CartInactive

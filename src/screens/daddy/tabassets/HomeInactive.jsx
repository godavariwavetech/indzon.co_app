// import * as React from "react"
// import Svg, { Path } from "react-native-svg"

// function HomeInactive(props) {
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
//         d="M21.09 7l-5.56-4.11a4.63 4.63 0 00-5.46 0L4.52 7a4.14 4.14 0 00-1.72 3.34v7.43A4.34 4.34 0 007.24 22h11.12a4.34 4.34 0 004.44-4.23v-7.44A4.15 4.15 0 0021.09 7zm.21 10.77a2.84 2.84 0 01-2.94 2.73H7.24a2.85 2.85 0 01-2.94-2.73v-7.43A2.65 2.65 0 015.41 8.2l5.55-4.1a3.12 3.12 0 013.68 0l5.55 4.11a2.61 2.61 0 011.11 2.12v7.44zm-13-2.02h9a.75.75 0 010 1.5h-9a.75.75 0 010-1.5z"
//         fill="#525252"
//       />
//     </Svg>
//   )
// }

// export default HomeInactive

import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function HomeInactive(props) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0_1_17186)">
        <Path
          d="M19.5 8.66l-.002-.002L11.34.5a1.829 1.829 0 00-1.302-.54A1.83 1.83 0 008.736.5L.582 8.654l-.008.009a1.843 1.843 0 00.003 2.6 1.83 1.83 0 001.279.54h.325v6.003c0 1.188.967 2.155 2.155 2.155h3.192a.586.586 0 00.586-.586v-4.707c0-.542.44-.983.983-.983h1.883c.542 0 .983.44.983.983v4.707c0 .323.262.586.586.586h3.191a2.157 2.157 0 002.155-2.155v-6.004h.302a1.83 1.83 0 001.302-.54A1.844 1.844 0 0019.5 8.66zm-.83 1.774a.665.665 0 01-.473.197h-.887a.586.586 0 00-.586.585v6.59c0 .542-.441.983-.984.983h-2.606v-4.121a2.157 2.157 0 00-2.155-2.155H9.098a2.158 2.158 0 00-2.155 2.155v4.121H4.336a.984.984 0 01-.983-.983v-6.59a.586.586 0 00-.586-.585h-.872a.664.664 0 01-.488-.196.67.67 0 010-.948l8.158-8.158a.665.665 0 01.946 0l8.157 8.156.004.004a.67.67 0 01-.002.945z"
          fill="#525252"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_1_17186">
          <Path fill="#525252" d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default HomeInactive

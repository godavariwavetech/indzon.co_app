import {StyleSheet} from 'react-native';

const commonStyles = StyleSheet.create({
  //COLORS
 appMainColor:'#85360B',
  bgColor: '#FFFDF4',
  mainColor:'#FFBF2D',
  btnColor:'#857300',
  btn2Color:'#E7432D',
  yellowColor:'#FD0',

  arrowBtnColor:'#FE4A31',

  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  mb4: {marginBottom: 4},
  mb8: {marginBottom: 8},
  mb12: {marginBottom: 12},
  mb16: {marginBottom: 16},
  mb20: {marginBottom: 20},
  mb24: {marginBottom: 24},
  mb32:{marginBottom:32},

  mt4: {marginTop: 4},
  mt8: {marginTop: 8},
  mt12: {marginTop: 12},
  mt16: {marginTop: 16},
  mt20: {marginTop: 20},
  mt24: {marginTop: 24},
  mt32: {marginTop: 32},
  mt40: {marginTop: 40},

  hr: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    alignSelf: 'stretch',
  },
  //headings and texts

  title:{
    fontSize:20,
    fontWeight:'700',
    color:'#2B2B2B',
  },

  heading: {
  
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  text1: {

  },
  text2: {
 
  },
  text3: {
    fontSize:14,
    fontWeight:'400',
    color:'#000',
  },
  text4: {
    fontSize:13,
    fontWeight:'400',
    color:'#000',
  },
  text5: {
    fontSize:12,
    fontWeight:'400',
    color:'#000',
  },
  
  
    //Buttons

    center:{
      flexDirection:'row',
      justifyContent:'center',
      alignItems:'center'
    },
})    
export default commonStyles;

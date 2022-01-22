export const colors = {
  berry: '#FF3687',
  blue: '#6585FF',
  blurple: '#664DFF',
  brightPurple: '#7733EA',
  darkBlue: '#222660',
  darkPurple: '#8571FF',
  digitalBlue: '#0033FF',
  fuschia: '#D96BFF',
  lavender: '#9973FF',
  lightBlue: '#CBD6FE',
  lightPurple: '#B1A5FF',
  lightestPurple: '#E1DDF5',
  mint: '#31E4A8',
  orange: '#FF7755',
  skyBlue: '#5CE1EC',
  transparentPurple: '#F3EDFF',
  yellow: '#FFCC4D',

  // Grayscale
  black: '#000000',
  gray1: '#292739',
  gray2: '#4F4F4F',
  gray3: '#8F949C',
  gray4: '#A3A9B5', // disabled gray
  gray5: '#E4E6ED',
  gray6: '#F1F1F1',
  gray7: '#EBEEF5',
  gray8: '#F3F5FB',
  white: '#FFFFFF',
  transparent: 'transparent',
}

export const colorType = Object.keys(colors).map(color => color)

// used for setting spacing throughout the app
export const multiplier = 8

export const gradients = {
  blue: 'linear-gradient(218.08deg, #6585FF -1.81%, #345BFF 97.67%)',
  bluePurple: 'linear-gradient(180deg, #9973FF 0%, #3A1AFF 100%)',
  blurple: 'linear-gradient(90deg, #5366FF -1.78%, #8B66FF 74.9%, #AE66FF 161.16%)',
  greenBlue: 'linear-gradient(180deg, #31e4a8 0%, #00d6e8 132.3%)',
  mintBlue: 'linear-gradient(180deg, #00D6E8 0%, #31E4A8 100%)',
  pinkOrange: 'linear-gradient(180deg, #FF9176 -5.84%, #CC33FF 113.43%)',
  grayBlue: 'linear-gradient(to top right, #EBEFFF 0%, #C2CEFF 100%)',
}

export const shadows = {
  button: '0px 10px 27px -10px rgba(89, 114, 215, 0.07)',
  card: '0px 0px 15px rgba(89, 114, 215, 0.15)',
  challenge: '-20px 20px 85px 40px rgba(89, 114, 215, 0.08)',
  cpc: '-12px 26px 25px rgba(89, 114, 215, 0.12)',
  cpcBubble: '-12px 10px 26px rgba(89, 114, 215, 0.08)',
  desktopCard: '0px 15px 15px rgba(89, 114, 215, 0.15)',
  input: '0px 6px 20px -2px rgba(0, 42, 80, 0.18)',
  inputFocus: '0px 14px 59px rgba(36, 47, 94, 0.12), 0px 21px 28px rgba(89, 114, 215, 0.18)',
  mobileFooter: '0px -5px 30px rgba(45, 49, 66, 0.1)',
  modal: '0px 0px 30px rgba(89, 114, 215, 0.15)',
  pill: '0 4px 34px rgba(102, 77, 255, 0.2)',
  reaction: '0px 0px 15px rgba(89, 114, 215, 0.15)',
  reward: '-20px 20px 205px 40px rgba(89, 114, 215, 0.18)',
  round: '0px 5px 15px rgba(114, 101, 227, 0.5)',
  roundNumber: '0px 3px 8px 1px rgba(66, 74, 183, 0.12)',
  sentNote: '-20px 20px 205px 40px rgba(89, 114, 215, 0.18)',
  spotlightReel: '0 15px 14px rgb(0 0 0 / 10%)',
}

export const fonts = {
  family: 'Karla',
  secondary: 'Rubik',
  lineHeight: '140.62%',
}

export const roundButton = {
  primary: {
    alignItems: 'center',
    border: 0,
    borderRadius: '50%',
    color: colors.white,
    cursor: 'pointer',
    display: 'flex',
    fontFamily: fonts.family,
    fontSize: '18px',
    fontWeight: 700,
    height: '65px',
    justifyContent: 'center',
    textAlign: 'center',
    width: '65px',
  },
}

export const pills = {
  disabled: {
    base: {
      backgroundColor: colors.gray7,
      boxShadow: 'none',
      pointerEvents: 'none',
    },
    children: {
      color: colors.gray3,
      cursor: 'default',
    },
  },
  inverted: {
    base: {
      backgroundColor: colors.white,
      boxShadow: shadows.button,
      filter: 'drop-shadow(0px 0px 11px rgba(89, 114, 215, 0.11))',
    },
    children: {
      color: colors.blurple,
    },
  },
  full: {
    base: {
      maxWidth: 'none',
    },
  },
  primary: {
    base: {
      borderRadius: '14px',
      display: 'inline-block',
      maxWidth: '374px',
      transition: 'all 250ms ease',
      width: '100%',
    },
    children: {
      color: colors.white,
      cursor: 'pointer',
      fontFamily: fonts.family,
      fontSize: '18px',
      fontWeight: '400',
      lineHeight: '18px',
      padding: '20px 15px',
      textAlign: 'center',
      transition: 'color 250ms ease',
    },
  },
  secondary: {
    base: {
      backgroundColor: colors.gray8,
    },
    children: {
      color: colors.blurple,
    },
  },
  small: {
    base: {
      width: 'auto',
    },
    children: {
      fontSize: '14px',
      fontWeight: 400,
      padding: '7px 15px',
    },
  },
  tertiary: {
    base: {
      backgroundColor: colors.gray8,
    },
    children: {
      color: colors.gray3,
    },
  },
  thin: {
    children: {
      padding: '14px 15px',
    },
  },
}

export const breakpoints = {
  smMobile: 360,
  mobile: 375,
  largeMobile: 411,
  tablet: 768,
  desktop: 1025,
  largeDesktop: 1272,
  xlDesktop: 1440,
  xxlDesktop: 1650,
}

// currently supporting down to a width of 320px for the iPhone SE...KA
export const devices = {
  smMobile: `min-width: ${breakpoints.smMobile}px`,
  mobile: `min-width: ${breakpoints.mobile}px`,
  largeMobile: `min-width: ${breakpoints.largeMobile}px`,
  tablet: `min-width: ${breakpoints.tablet}px`,
  desktop: `min-width: ${breakpoints.desktop}px`,
  largeDesktop: `min-width: ${breakpoints.largeDesktop}px`,
  xlDesktop: `min-width: ${breakpoints.xlDesktop}px`,
  xxlDesktop: `min-width: ${breakpoints.xxlDesktop}px`,
}

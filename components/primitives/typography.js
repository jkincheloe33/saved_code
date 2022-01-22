import styled from 'styled-components'
import { colors, devices, fonts } from '@assets'

// prettier-ignore
export const Text = styled.span`
  // pass a string that matches a theme color, pass a hex or rgb color, or default to gray3...JK
  color: ${p => (colors[p.color] ? `${colors[p.color]}` : p.color ?? colors.gray3)};
  font-family: ${p => fonts[p.fontFamily] ?? fonts.family};
  // you can pass in an array of two fontSizes or a single value - example: fontSize={['14px', '16px']} or just fontSize='14px'...JK
  font-size: ${p => Array.isArray(p.fontSize) ? p.fontSize[0] : p.fontSize ?? '16px'};
  font-style: ${p => p.fontStyle ?? 'normal'};
  font-weight: ${p => p.fontWeight ?? '400'};
  line-height: ${fonts.lineHeight};

  ${p => (!p.noClamp || p.maxLines) && `
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: ${p.maxLines ? p.maxLines : 1};
    -webkit-box-orient: vertical;
  `}

  // check if fontSize is an array an has a second value. if so, set the font-size...JK
  @media (${devices.desktop}) {
    ${p => Array.isArray(p.fontSize) && p.fontSize?.[1] && `font-size: ${p.fontSize[1]}; `}
  }
`

// prettier-ignore
export const Paragraph = styled(Text).attrs({ as: 'p', noClamp: true })`
  // pass a string that matches a theme color, pass a hex or rgb color, or default to gray1...JK
  color: ${p => (colors[p.color] ? `${colors[p.color]}` : p.color ?? colors.gray1)};
  margin: 0;
`

// prettier-ignore
export const Title = styled(Text).attrs({ noClamp: true })`
  // pass a string that matches a theme color, pass a hex or rgb color, or default to gray1...JK
  color: ${p => (colors[p.color] ? `${colors[p.color]}` : p.color ?? colors.gray1)};
  display: flex;
  // you can pass in an array of two fontSizes or a single value - example: fontSize={['14px', '16px']} or just fontSize='14px'...JK
  font-size: ${p => Array.isArray(p.fontSize) ? p.fontSize[0] : p.fontSize ?? '20px'};
  font-weight: ${p => p.fontWeight ?? '700'};
  justify-content: ${p => p.justifyContent ?? 'center'};

  // check if fontSize is an array an has a second value. if so, set the font-size...JK
  @media (${devices.desktop}) {
    ${p => Array.isArray(p.fontSize) && p.fontSize?.[1] && `font-size: ${p.fontSize[1]}; `}
  }
`

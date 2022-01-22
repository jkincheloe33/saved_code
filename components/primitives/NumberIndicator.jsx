import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, fonts, shadows } from '@assets'

const Wrapper = styled.div`
  align-items: center;
  background: ${p => p.background ?? colors.white};
  border-radius: 100px;
  box-shadow: ${shadows.roundNumber};
  color: ${p => (colors[p.color] ? `${colors[p.color]}` : colors.darkBlue)};
  display: flex;
  font-family: ${fonts.secondary};
  height: ${p => p.ratio};
  justify-content: center;
  letter-spacing: -0.05em;
  position: absolute;
  top: ${p => p.top ?? '0'};
  right: ${p => p.right ?? '0'};
  width: ${p => p.ratio};

  ${p =>
    p.small &&
    ` background-color: ${colors.berry};
      color: ${colors.white};
      font-size: 12px;
    `}
`

const NumberIndicator = ({ background, color, count, ratio = '30px', right, small, top }) => {
  // if count is larger than 9 then + is added...PS
  const addPlus = count => (count > 9 ? '9+' : `${count}`)

  return (
    <Wrapper background={background} color={color} ratio={ratio} right={right} small={small} top={top}>
      {count && addPlus(count)}
    </Wrapper>
  )
}

NumberIndicator.propTypes = {
  background: PropTypes.string,
  color: PropTypes.string,
  count: PropTypes.number,
  ratio: PropTypes.string,
  right: PropTypes.string,
  small: PropTypes.bool,
  top: PropTypes.string,
}

export default NumberIndicator

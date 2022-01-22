import PropTypes from 'prop-types'
import styled from 'styled-components'

import { ArrowIcon, colorType } from '@assets'
import { Text } from '@components'

const Wrapper = styled.a`
  align-items: center;
  display: inline-flex;
  flex-direction: ${p => (p.flip ? 'row-reverse' : 'row')};

  span {
    padding: ${p => (p.flip ? '2px 5px 0 0' : '2px 0 0 5px')};
  }
`

const ScreenNavigation = ({ color = 'digitalBlue', flip = false, link, onClick, text }) => {
  return (
    <Wrapper href={link} onClick={onClick} flip={flip}>
      <ArrowIcon color={color} flip={flip} />
      {text && (
        <Text color={color} fontWeight='700'>
          {text}
        </Text>
      )}
    </Wrapper>
  )
}

ScreenNavigation.propTypes = {
  color: PropTypes.oneOf(colorType),
  flip: PropTypes.bool,
  link: PropTypes.string,
  onClick: PropTypes.func,
  text: PropTypes.string,
}

export default ScreenNavigation

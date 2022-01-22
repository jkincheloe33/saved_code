import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Text } from '@components'

const InitialsWrapper = styled.div`
  align-items: center;
  background-image: linear-gradient(42deg, ${colors.darkPurple} 3%, ${colors.lightPurple} 115%);
  border-radius: ${p => p.radius};
  display: flex;
  height: ${p => p.height};
  min-height: ${p => p.height};
  min-width: ${p => p.width};
  justify-content: center;
  width: ${p => p.width};

  ${Text} {
    text-transform: uppercase;
  }
`

const InitialsBox = ({ className, fontSize, height = 'auto', initials, onClick, radius = '0', width = 'auto', ...props }) => (
  <InitialsWrapper {...props} className={className} height={height} onClick={onClick} radius={radius} width={width}>
    <Text color='white' fontSize={fontSize}>
      {initials}
    </Text>
  </InitialsWrapper>
)

InitialsBox.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  fontSize: PropTypes.string,
  height: PropTypes.string,
  initials: PropTypes.string,
  onClick: PropTypes.func,
  radius: PropTypes.string,
  width: PropTypes.string,
}

export default InitialsBox

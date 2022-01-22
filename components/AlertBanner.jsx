import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, ErrorIcon, multiplier } from '@assets'
import { Image, Text } from '@components'

const Errors = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${multiplier * 2}px;
`

const Wrapper = styled.div`
  align-items: center;
  background-color: ${colors.berry}26;
  border-radius: 20px;
  display: flex;
  margin-top: ${multiplier * 3}px;
  padding: ${multiplier * 2}px ${multiplier * 3}px;
`

const AlertBanner = ({ errors = [] }) => {
  return (
    <Wrapper>
      <Image alt='Error icon' src={ErrorIcon} width='16px' />
      <Errors>
        {errors.map(
          (e, i) =>
            e.length > 0 && (
              <Text color='berry' fontSize='14px' key={i} noClamp>
                {e}
              </Text>
            )
        )}
      </Errors>
    </Wrapper>
  )
}

AlertBanner.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default AlertBanner

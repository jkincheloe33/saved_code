import styled from 'styled-components'
import PropTypes from 'prop-types'

import { devices } from '@assets'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding: 2rem;
  max-width: 681px;
  margin: 0 auto;

  @media (${devices.tablet}) {
    margin: auto;
  }
`

const Container = ({ className, children }) => {
  return <StyledContainer className={className}>{children}</StyledContainer>
}

Container.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
}

export default Container

import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, shadows } from '@assets'

const Wrapper = styled.div`
  background-color: ${colors.white};
  border-radius: 20px 20px 0px 0px;
  bottom: 0;
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: ${p => p.column && 'column'};
  justify-content: space-between;
  left: 0;
  padding: 30px 20px;
  position: fixed;
  width: 100%;
  z-index: 5;
`

const CtaFooter = ({ children, column }) => <Wrapper column={column}>{children}</Wrapper>

CtaFooter.propTypes = {
  children: PropTypes.any,
  column: PropTypes.bool,
}

export default CtaFooter

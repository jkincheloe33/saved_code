import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CloseIcon, colors, multiplier } from '@assets'
import { Title } from '@components'

const CloseIconWrapper = styled.div`
  cursor: pointer;
  height: 33px;
  margin: auto ${multiplier * 2}px auto 0;
  width: 34px;
  z-index: 1;
`

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: ${p => (p.closable ? 'row' : 'column')};
`

const StyledTitle = styled(Title)`
  border-bottom: 1px solid ${colors.gray5};
  padding: ${multiplier * 2}px 0;
`

const Wrapper = styled.div`
  background-color: ${p => p.closable && colors.gray8};
  border: 1px solid ${p => (p.closable ? colors.gray8 : colors.gray5)};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

const Banner = ({ children, className, closable, onClose, title }) => {
  return (
    <Wrapper className={className} closable={closable}>
      {title && (
        <StyledTitle fontSize='16px' fontWeight={700}>
          {title}
        </StyledTitle>
      )}
      <InnerWrapper closable={closable}>
        {children}
        {closable && (
          <CloseIconWrapper onClick={onClose}>
            <CloseIcon />
          </CloseIconWrapper>
        )}
      </InnerWrapper>
    </Wrapper>
  )
}

Banner.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  closable: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
}

export default Banner

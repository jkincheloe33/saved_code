import PropTypes, { oneOfType } from 'prop-types'
import styled from 'styled-components'

import { ArrowIcon } from '@assets'
import { Title } from '@components'
import { uId } from '@utils'

import Header from './Header'

const SIDE_CONTAINER_WIDTH = '86px'

const LeftContainer = styled.div`
  align-items: center;
  cursor: ${p => (p.onClick ? 'pointer' : 'auto')};
  display: flex;
  justify-content: flex-start;
  width: ${SIDE_CONTAINER_WIDTH};
`

const RightContainer = styled.div`
  cursor: pointer;
  width: ${SIDE_CONTAINER_WIDTH};
`

const InnerHeader = ({ cta, dark = false, handleBack, id, leftCta, title }) => (
  <Header dark={dark} inner>
    <LeftContainer id={id ? `${id}-back-btn` : uId('back-btn')} onClick={leftCta?.onClick ?? handleBack}>
      {handleBack && <ArrowIcon color='gray4' />}
      {leftCta?.text && (
        <Title color='blurple' fontSize='16px'>
          {leftCta.text}
        </Title>
      )}
    </LeftContainer>
    {title && <Title id={uId('inner-header-title')}>{title}</Title>}
    <RightContainer id={uId('cta-button')} onClick={cta?.onClick}>
      {cta && (
        <>
          {cta.component && cta.component}
          {cta.text && (
            <Title color='blurple' fontSize='16px' justifyContent='flex-end'>
              {cta.text}
            </Title>
          )}
        </>
      )}
    </RightContainer>
  </Header>
)

InnerHeader.propTypes = {
  cta: PropTypes.shape({
    component: PropTypes.any,
    onClick: PropTypes.func,
    text: PropTypes.string,
  }),
  dark: PropTypes.bool,
  handleBack: oneOfType([PropTypes.func, PropTypes.string, PropTypes.bool]),
  id: PropTypes.string,
  leftCta: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      onClick: PropTypes.func,
      text: PropTypes.string,
    }),
  ]),
  title: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
}

export default InnerHeader

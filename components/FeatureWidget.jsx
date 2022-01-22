import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, multiplier, shadows } from '@assets'
import { Card, PillButton, RoundButton, RoundButtonPropTypes, Title } from '@components'

const Content = styled.div`
  padding: 0 ${p => (p.drafts ? 0 : multiplier * 2)}px;

  @media (${devices.largeDesktop}) {
    padding: 0 ${p => (p.drafts ? 0 : multiplier * 3)}px;
  }
`

const Header = styled.div`
  align-items: center;
  background-color: ${colors.white};
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
  display: ${p => (p.hideTitleMobile ? 'none' : 'flex')};
  justify-content: space-between;
  padding: ${p => (p.hasChildren ? `0 ${multiplier * 2}px` : `${multiplier * 2}px`)};
  padding-bottom: ${multiplier * 2}px;

  ${p => p.border && `border-bottom: 1px solid ${colors.gray7}B3;`}

  @media (${devices.largeDesktop}) {
    border: none;
    display: flex;
    padding: ${p => (p.hasChildren ? `0 ${multiplier * 3}px` : `${multiplier * 3}px`)};
    padding-bottom: ${p => (p.hasChildren ? `${multiplier * 2}px` : `${multiplier * 3}px`)};
  }
`

const Wrapper = styled(Card)`
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  margin: 0 0 40px;
  overflow: hidden;
  padding: ${p => (p.noChildren ? 0 : multiplier * 2)}px 0;

  @media (${devices.largeDesktop}) {
    box-shadow: ${shadows.card};
    margin-bottom: 45px;
    padding: ${p => (p.noChildren ? 0 : multiplier * 3)}px 0;
  }
`

const FeatureWidget = ({ border = false, children, className, cta, drafts = false, hideTitleMobile = false, title, viewAll }) => (
  <Wrapper className={className} noChildren={!children}>
    <Header hasChildren={!!children} border={border} clickable={!!cta?.onClick} hideTitleMobile={hideTitleMobile} onClick={cta?.onClick}>
      <Title fontSize={['18px', '20px']} fontWeight={600} justifyContent='flex-start'>
        {title}
      </Title>
      {viewAll && <PillButton {...viewAll} buttonType='secondary' small text='View all' />}
      {cta && <RoundButton {...cta} />}
    </Header>
    {children && <Content drafts={drafts}>{children}</Content>}
  </Wrapper>
)

FeatureWidget.propTypes = {
  border: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  className: PropTypes.string,
  cta: PropTypes.shape(RoundButtonPropTypes),
  drafts: PropTypes.bool,
  hideTitleMobile: PropTypes.bool,
  title: PropTypes.string.isRequired,
  viewAll: PropTypes.shape({
    id: PropTypes.string,
    onClick: PropTypes.func,
  }),
}

export default FeatureWidget

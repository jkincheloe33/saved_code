import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, multiplier } from '@assets'
import { InnerHeader } from '@components'
import { useSpacingContext } from '@contexts'

const Card = styled.div`
  padding: ${multiplier * 3}px 0 0;

  @media (${devices.largeDesktop}) {
    padding: ${multiplier * 2}px 0 0;
  }
`

const Wrapper = styled.div`
  background-color: ${colors.white};
  display: ${p => (p.mobile ? 'block' : 'none')};
  height: 100%;
  left: 0;
  overflow: auto;
  padding: ${p => (p.extraPadding ? `${p.extraPadding}px` : 0)} 0 0;
  position: absolute;
  top: 0;
  transform: translateX(${p => (p.open ? 0 : '110%')});
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
  z-index: 5;

  @media (${devices.largeDesktop}) {
    background-color: transparent;
    display: ${p => (p.mobile ? 'none' : 'block')};
    flex: 1 1 auto;
    padding: ${multiplier * 2}px ${multiplier * 4}px;
    position: relative;
    transform: translateX(0);
    z-index: 1;
  }
`

const HubContent = ({ data, mobile = false, navigation, open = false }) => {
  const { innerHeaderHeight } = useSpacingContext()

  const { component: Component, props, title } = { ...data }

  return (
    <Wrapper
      extraPadding={mobile && innerHeaderHeight}
      id={navigation ? 'hub-content-container-mobile' : 'hub-content-container'}
      mobile={mobile}
      open={open}
    >
      {navigation && <InnerHeader {...navigation} title={title} />}
      <Card>{data && <Component {...props} mobile={!!navigation} />}</Card>
    </Wrapper>
  )
}

HubContent.propTypes = {
  data: PropTypes.object,
  mobile: PropTypes.bool,
  navigation: PropTypes.object,
  open: PropTypes.bool,
}

export default HubContent

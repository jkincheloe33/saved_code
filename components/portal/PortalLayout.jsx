import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { Layout, PortalHeader } from '@components'

const Wrapper = styled.div`
  padding-bottom: 120px;

  @media (${devices.tablet}) {
    padding-bottom: 0;
  }
`

const PortalLayout = ({ children, handleBack, handleStartOver, noHeader }) => {
  return (
    <Layout full id='portal' isPortal noFooter noHeader scroll head='Wambi Review'>
      {!noHeader ? <PortalHeader handleBack={handleBack} handleStartOver={handleStartOver} /> : null}
      <Wrapper>{children}</Wrapper>
    </Layout>
  )
}

PortalLayout.propTypes = {
  children: PropTypes.any,
  handleBack: PropTypes.func,
  handleStartOver: PropTypes.func,
  noHeader: PropTypes.bool,
}

export default PortalLayout

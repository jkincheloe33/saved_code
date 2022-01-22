import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { MenuIcon, WambiLogo } from '@assets'
import { Image, Modal, PortalSidebar, ScreenNavigation, VolunteerModal } from '@components'
import { useReviewerContext } from '@contexts'

const Hamburger = styled(Image)`
  cursor: pointer;
  width: 40px;
`

const LogoImage = styled(Image)`
  cursor: ${p => !p.disabled && p.onClick && 'pointer'};
  width: 60px;
`

const Wrapper = styled.header`
  align-items: center;
  display: flex;
  flex-direction: ${p => (p.handleBack ? 'row-reverse' : 'row')};
  min-height: 70px;
  padding: 20px 20px 0;
  justify-content: space-between;
  width: 100%;
`

const PortalHeader = ({ handleBack, handleStartOver }) => {
  const [expanded, setExpanded] = useState(false)

  const { openVolunteerModal, setOpenVolunteerModal } = useReviewerContext()

  return (
    <Wrapper handleBack={Boolean(handleBack)}>
      <LogoImage alt='Wambi Logo' onClick={handleStartOver} src={WambiLogo} />
      {handleBack ? (
        <ScreenNavigation id='portal-back-btn' link={handleBack} text='Back' />
      ) : (
        <Hamburger alt='hamburger' id='portal-sidebar-btn' onClick={() => setExpanded(!expanded)} src={MenuIcon} />
      )}
      <Modal handleClose={() => setExpanded(false)} open={expanded} sidebar small>
        <PortalSidebar handleStartOver={handleStartOver} setExpanded={setExpanded} setOpenVolunteerModal={setOpenVolunteerModal} />
      </Modal>
      <VolunteerModal open={openVolunteerModal} setOpen={setOpenVolunteerModal} />
    </Wrapper>
  )
}

PortalHeader.propTypes = {
  handleBack: PropTypes.func,
  handleStartOver: PropTypes.func,
}

export default PortalHeader

import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { LocationTile, PillButton } from '@components'
import { useLangContext } from '@contexts'

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 443px;
  justify-content: space-evenly;
  margin: auto;
  padding: 1rem 2rem;
  text-align: center;
  width: 300px;
  z-index: 100;

  @media (${devices.mobile}) {
    width: 337px;
  }

  @media (${devices.tablet}) {
    height: 521px;
    width: 396px;
  }
`

const LocationModal = ({ location, onClick }) => {
  const { getText } = useLangContext()

  return (
    <Wrapper>
      <LocationTile column={true} location={location} showLargeBadge />
      {location.id && <PillButton id='location-modal-btn' onClick={onClick} text={getText('NEXT')} />}
    </Wrapper>
  )
}

LocationModal.propTypes = {
  location: PropTypes.object,
  onClick: PropTypes.func,
}

export default LocationModal

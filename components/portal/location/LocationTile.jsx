import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, StockBuilding, WambiBadgePurple1 } from '@assets'
import { Image, Text, Title } from '@components'

const Address = styled(Text)`
  padding-top: ${p => (p.column ? '14px' : 0)};
`

const Badge = styled(Image)`
  bottom: -2px;
  position: absolute;
  right: -5px;
  width: ${p => (p.showLargeBadge ? '45px' : '28px')};
`

const Building = styled(Image)`
  border-radius: 12px;
  object-fit: cover;
  width: 100%;
`

// prettier-ignore
const ImageWrapper = styled.div`
  margin: 0 auto;
  max-width: 163px;
  position: relative;
  width: 100%;

  ${p => p.thumbnail && `
    margin: 0;
    max-width: 85px;
  `}
`

const Info = styled.div`
  align-items: center;
  display: ${p => (p.column ? 'flex' : 'block')};
  flex-direction: column;
  padding-left: ${p => p.thumbnail && '1.5rem'};
  padding-top: ${p => p.column && '15px'};
`

const Wrapper = styled.div`
  align-items: center;
  background: ${colors.white};
  border-bottom: ${p => !p.column && '1px solid #f2f2f2'};
  cursor: ${p => (p.thumbnail ? 'pointer' : 'auto')};
  display: ${p => !p.column && 'flex'};
  padding: ${p => (p.thumbnail ? '1rem 0' : 0)};
  width: 100%;

  &:last-of-type {
    border-bottom: none;
  }
`

const LocationTile = ({ location, column, handleClick, showLargeBadge = false, thumbnail = false }) => {
  const { name, shortTitle, longTitle, image } = location
  return (
    <Wrapper column={column} onClick={handleClick} id='location-tile' thumbnail={thumbnail}>
      <ImageWrapper showLargeBadge={showLargeBadge} thumbnail={thumbnail}>
        <Building src={image ?? StockBuilding} alt={`${name} building or stock building image`} />
        <Badge src={WambiBadgePurple1} alt='Purple Wambi logo' />
      </ImageWrapper>
      <Info column={column} thumbnail={thumbnail}>
        <Title color='darkBlue' fontSize='18px' justifyContent='flex-start'>
          {name}
        </Title>
        <Address column={column} noClamp>
          {shortTitle}
        </Address>
        <Text>{longTitle}</Text>
      </Info>
    </Wrapper>
  )
}

LocationTile.propTypes = {
  location: PropTypes.object,
  imageUrl: PropTypes.string,
  column: PropTypes.bool,
  handleClick: PropTypes.func,
  thumbnail: PropTypes.bool,
  showLargeBadge: PropTypes.bool,
}

export default LocationTile

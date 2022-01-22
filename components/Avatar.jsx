import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, shadows } from '@assets'
import { useProfileContext } from '@contexts'

const Anchor = styled.a`
  display: block;
  height: 100%;
  width: 100%;
`

// prettier-ignore
const Icon = styled.div`
  align-items: center;
  background-image: linear-gradient(42deg, ${colors.darkPurple} 3%, ${colors.lightPurple} 115%);
  border: ${p => (p.border ? `2px solid ${colors.white}` : 'none')};
  border-radius: 50%;
  box-shadow: ${p => (p.shadow ? shadows.button : 'none')};
  color: ${colors.white};
  cursor: ${p => (p.pointer && 'pointer')};
  display: flex;
  font-size: calc(${p => p.ratio} / 2.5);
  height: ${p => p.ratio};
  justify-content: center;
  overflow: hidden;
  text-transform: uppercase;
  width: ${p => p.ratio};

  ${p => p.image && p.image.length > 2 && `
    background: url(${p.image}) no-repeat center center;
    background-size: ${p.cover ? 'contain' : 'auto'};
  `}
`

const Avatar = ({
  border,
  className,
  cover = true,
  id,
  image,
  link,
  onClick,
  personId,
  type,
  ratio = '67px',
  setViewDetails,
  shadow = false,
}) => {
  const { setProfileType, setSelectedProfileId, setShowProfile } = useProfileContext()

  const handleClick = personId => {
    if (onClick) {
      onClick()
    } else if (personId) {
      setShowProfile(true)
      setSelectedProfileId(personId)
      setProfileType(type)
      // Any time user opens profile from cpc details item, it will close that cpc behind it when clicking back...JC
      if (setViewDetails) {
        setViewDetails(false)
      }
    }
  }

  return (
    <Icon
      border={border}
      className={className}
      cover={cover}
      id={id}
      image={image}
      onClick={() => handleClick(personId)}
      pointer={Boolean(link || onClick || personId)}
      ratio={ratio}
      shadow={shadow}
    >
      {image && image.length < 3 && image}
      {link && <Anchor href={link} />}
    </Icon>
  )
}

Avatar.propTypes = {
  border: PropTypes.bool,
  className: PropTypes.string,
  cover: PropTypes.bool,
  id: PropTypes.string,
  image: PropTypes.string,
  link: PropTypes.string,
  personId: PropTypes.number,
  onClick: PropTypes.func,
  ratio: PropTypes.string, // unit of measure e.g 67px || 2vw...JK
  setViewDetails: PropTypes.func,
  shadow: PropTypes.bool,
  type: PropTypes.string,
}

export default Avatar

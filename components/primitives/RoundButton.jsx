import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, roundButton, shadows } from '@assets'
import { Anchor, Image } from '@components'

const { primary } = roundButton

const Button = styled.button`
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;

  &:focus {
    outline: none;
  }

  ${p =>
    p.disable &&
    `
    opacity: 0.5;
  `}
`

const Link = styled(Anchor)`
  box-sizing: border-box;
  display: block;
  text-decoration: none;
`
const Wrapper = styled.div`
  ${primary}
  background: ${p => p.background ?? colors.blurple};
  box-shadow: ${p => (p.shadow ? shadows.round : 'none')};
  height: ${p => p.ratio};
  width: ${p => p.ratio};
`

const RoundButton = ({ background, className, disable, iconWidth, id, image, link, onClick, ratio = '67px', shadow = false, ...props }) => (
  <Wrapper background={background} className={className} ratio={ratio} shadow={shadow}>
    {link ? (
      <Link {...props} alt={image.alt} id={id} image={image.src} iconWidth={iconWidth} link={link} />
    ) : (
      <Button {...props} disable={disable} id={id} onClick={onClick}>
        <Image {...image} width={iconWidth} />
      </Button>
    )}
  </Wrapper>
)

export const RoundButtonPropTypes = {
  background: PropTypes.string,
  className: PropTypes.string,
  disable: PropTypes.bool,
  hide: PropTypes.bool,
  iconWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  id: PropTypes.string,
  image: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
  }),
  link: PropTypes.string,
  onClick: PropTypes.func,
  ratio: PropTypes.string,
  shadow: PropTypes.bool,
}

RoundButton.propTypes = RoundButtonPropTypes

export default RoundButton

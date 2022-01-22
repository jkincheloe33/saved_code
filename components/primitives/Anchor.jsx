import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Image, Text } from '@components'

const ImageWrapper = styled.div`
  width: 30px;
`

const Wrapper = styled.a`
  ${p =>
    p.flip &&
    css`
      display: flex;
      flex-direction: row-reverse;
      justify-content: flex-end;
    `}

  ${p => p.disabled && 'pointer-events: none;'}
`

const Anchor = ({
  alt,
  color,
  disabled,
  flip,
  fontSize,
  fontWeight,
  iconWidth,
  image,
  link,
  noClamp = false,
  onClick,
  target = '_self',
  text,
  ...props
}) => (
  <Wrapper {...props} disabled={disabled} flip={flip} href={link} onClick={onClick} target={target}>
    {text && (
      <Text color={color ?? 'darkBlue'} fontSize={fontSize} fontWeight={fontWeight} noClamp={noClamp}>
        {text}
      </Text>
    )}
    {image && (
      <ImageWrapper>
        <Image alt={alt} src={image} width={iconWidth} />
      </ImageWrapper>
    )}
  </Wrapper>
)

Anchor.propTypes = {
  alt: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  flip: PropTypes.bool,
  fontSize: PropTypes.string,
  fontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  iconWidth: PropTypes.string,
  image: PropTypes.string,
  link: PropTypes.string,
  noClamp: PropTypes.bool,
  onClick: PropTypes.func,
  text: PropTypes.string,
  target: PropTypes.string,
}

Anchor.displayName = 'Anchor'

export default Anchor

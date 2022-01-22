import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Avatar, Text } from '@components'

const Container = styled.div`
  align-items: center;
  display: flex;
  position: relative;
  width: 100%;

  ${p =>
    p.column &&
    `
     flex-direction: column;
     margin-top: 2rem;
   `}
`

const ImagesWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  margin-left: ${p => (p.imgCount > 1 && p.column ? `calc(13px * ${p.imgCount - 1})` : '0')};
  margin-right: ${p => (p.column ? '0' : '10px')};
`

const ImgWrapper = styled.div`
  background: ${colors.white};
  border-radius: 50%;
  display: flex;
  transform: translateX(-${p => p.index * 13}px);
`

const PTileText = styled(Text)`
  margin-right: 5px;
`

const TextWrapper = styled.div`
  // add space between the avatar and name in row view...PS
  margin-left: ${p => (p.spacing ? `${p.imgCount + 0.8}rem` : '0')};
  width: 100%;

  ${p =>
    p.column &&
    `
    display: flex;
    justify-content: center;
    margin-top: 1rem;
   `}

  ${p =>
    p.imgCount > 2 &&
    !p.column &&
    `
    margin-left: -20px;
    `}
`

const TitleWrapper = styled.div`
  align-items: flex-end;
  display: ${p => (p.column ? 'block' : 'flex')};
  flex-wrap: wrap;
`

const WambiPeopleTile = ({
  border,
  color,
  column = false,
  extraInfo,
  images,
  onClick = () => {},
  ratio = '50px',
  showNames,
  spacing,
  subtitle,
  title,
}) => {
  const imgCount = images && images.length >= 3 ? 3 : images.length
  return (
    <Container column={column} onClick={onClick}>
      <ImagesWrapper column={column} imgCount={imgCount} ratio={ratio}>
        {images.slice(0, 3).map((image, i) => (
          <ImgWrapper index={i} key={i}>
            <Avatar border={border} image={image} ratio={imgCount > 1 ? '45px' : ratio} shadow={!image} />
          </ImgWrapper>
        ))}
      </ImagesWrapper>
      <TextWrapper column={showNames || column} imgCount={imgCount} spacing={spacing}>
        <TitleWrapper column={showNames || column}>
          <PTileText color={color} fontWeight={700} justifyContent={column ? 'center' : 'left'} noClamp={showNames}>
            {showNames || images.length === 1 ? title : `${images.length} people`}
          </PTileText>
        </TitleWrapper>
        {subtitle && <Text>{subtitle}</Text>}
        {extraInfo && <Text>{extraInfo}</Text>}
      </TextWrapper>
    </Container>
  )
}

WambiPeopleTile.propTypes = {
  border: PropTypes.bool,
  color: PropTypes.string,
  column: PropTypes.bool,
  extraInfo: PropTypes.string,
  images: PropTypes.array.isRequired,
  onClick: PropTypes.func,
  ratio: PropTypes.string,
  showNames: PropTypes.bool,
  spacing: PropTypes.bool,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
}

export default WambiPeopleTile

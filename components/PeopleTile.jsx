import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Avatar, Text } from '@components'
import { numberFormatter } from '@utils'

const Container = styled.div`
  align-items: center;
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
  display: flex;
  margin: 12px 0;
  position: relative;
  width: 100%;
`

const ImagesWrapper = styled.div`
  align-items: center;
  display: flex;
  height: ${p => p.ratio};
  margin-right: 20px;
  position: relative;
  width: ${p => (p.imgCount > 1 ? `calc(30px * ${p.imgCount})` : `calc(${p.ratio} + 5px)`)};
`

const ImgWrapper = styled.div`
  background: ${colors.white};
  border-radius: 50%;
  left: ${p => `${p.index * 20}px`};
  position: absolute;
  z-index: ${p => p.index};
`

const OtherPeopleCircle = styled.div`
  align-items: center;
  background-color: ${colors.gray7};
  border-radius: 30px;
  display: flex;
  height: 35px;
  justify-content: center;
  width: 35px;
`

const PTileText = styled(Text)`
  margin-right: 5px;
`

const SubtitleWrapper = styled.div`
  display: flex;
`

const TextWrapper = styled.div`
  width: 100%;
`

const TitleWrapper = styled.div`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
`

const PeopleTile = ({ border, className, extraInfo, id, images, onClick, personId, ratio = '41px', relTimeAgo, subtitle, title }) => {
  const fontSize = ['14px', '16px']
  const imgCount = images?.length >= 3 ? 3 : images.length

  return (
    <Container
      className={className}
      clickable={Boolean(onClick)}
      id={id}
      onClick={() => {
        if (onClick) return onClick()
      }}
    >
      <ImagesWrapper imgCount={imgCount} ratio={ratio}>
        {images.slice(0, 2).map((image, i) => (
          <ImgWrapper key={i} index={i}>
            <Avatar border={border} image={image} personId={personId} ratio={imgCount > 1 ? '35px' : ratio} shadow={!image} />
          </ImgWrapper>
        ))}
        {images.length > 2 && (
          <ImgWrapper index={2}>
            <OtherPeopleCircle>
              <Text fontSize={fontSize} fontWeight={700}>
                +{images.length - 2}
              </Text>
            </OtherPeopleCircle>
          </ImgWrapper>
        )}
      </ImagesWrapper>
      <TextWrapper>
        <TitleWrapper>
          <PTileText color='gray1' fontSize={fontSize} fontWeight={700}>
            {title}
          </PTileText>
          {images.length > 1 && <PTileText color='gray2' fontSize={fontSize}>{`+ ${numberFormatter(images.length - 1)} others`}</PTileText>}
          {relTimeAgo && <Text fontSize={fontSize}>{relTimeAgo}</Text>}
        </TitleWrapper>
        {subtitle && (
          <SubtitleWrapper>
            <Text fontSize={fontSize}>{subtitle}</Text>
          </SubtitleWrapper>
        )}
        {extraInfo && (
          <SubtitleWrapper>
            <Text fontSize={fontSize}>{extraInfo}</Text>
          </SubtitleWrapper>
        )}
      </TextWrapper>
    </Container>
  )
}

PeopleTile.propTypes = {
  border: PropTypes.bool,
  className: PropTypes.string,
  extraInfo: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  id: PropTypes.string,
  images: PropTypes.array.isRequired,
  onClick: PropTypes.func,
  personId: PropTypes.number,
  ratio: PropTypes.string,
  relTimeAgo: PropTypes.string,
  setSelectedProfileId: PropTypes.func,
  setShowProfile: PropTypes.func,
  subtitle: PropTypes.string,
  title: PropTypes.string,
}

export default PeopleTile

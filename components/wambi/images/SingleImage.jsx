import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { Image as ImageBase } from '@components'

const SPACING = 22

const Image = styled(ImageBase)`
  border-radius: 15px;
  width: 100%;
`

const ImageWrapper = styled.div`
  cursor: pointer;
  flex: 0 0 210px;
  padding-left: ${SPACING}px;
  overflow: hidden;
  transition: transform 250ms ease;
  width: 232px;

  @media (${devices.largeDesktop}) {
    flex: 0 0 ${p => p.width / 3}px;
    width: ${p => p.width / 3}px;

    img {
      margin: 0 auto;
      max-width: 210px;
    }
  }
`

const SingleImage = ({ containerWidth, handleSelect, handleSize, image, index }) => {
  const ref = useRef(null)

  useEffect(() => {
    // used to get the height of each newsfeed item for virtualization list in newsfeed...JK
    setTimeout(() => {
      if (ref?.current && handleSize) handleSize(index, ref.current.clientWidth)
    }, 10)
  }, [handleSize, index])

  return (
    <ImageWrapper onClick={() => handleSelect(image)} ref={ref} width={containerWidth}>
      <Image alt='Wambi image' src={image.src} />
    </ImageWrapper>
  )
}

SingleImage.propTypes = {
  containerWidth: PropTypes.number,
  handleSelect: PropTypes.func,
  handleSize: PropTypes.func,
  image: PropTypes.object,
  index: PropTypes.number,
}

export default SingleImage

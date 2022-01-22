import PropTypes from 'prop-types'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import styled from 'styled-components'

import { colors } from '@assets'
import { DynamicContainer, Image as ImageBase } from '@components'

const Image = styled(ImageBase)`
  // needed for IOS...JK
  align-self: center;
  width: 100%;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  background-color: ${colors.black};
  display: flex;
  justify-content: center;
`

const ZoomPinch = ({ image }) => (
  <Wrapper>
    <TransformWrapper wheel={{ step: 10, wheelEnabled: false }} zoomIn={{ animation: false, step: 10 }}>
      <TransformComponent>
        <Image {...image} />
      </TransformComponent>
    </TransformWrapper>
  </Wrapper>
)

ZoomPinch.propTypes = {
  image: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
  }),
}

export default ZoomPinch

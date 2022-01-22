import AvatarEditor from 'react-avatar-editor'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const CanvasWrapper = styled(AvatarEditor)`
  border-radius: 20px;

  canvas {
    height: 100% !important;
    width: 100% !important;
  }
`

const ImageCanvas = ({ border, height, imageURL, width }) => (
  <CanvasWrapper
    border={border}
    className='pending-image'
    color={[255, 255, 255, 0.6]} // color of frame
    height={height}
    id='pending-image'
    image={imageURL}
    width={width}
  />
)

ImageCanvas.propTypes = {
  border: PropTypes.number,
  height: PropTypes.number,
  imageURL: PropTypes.string,
  width: PropTypes.number,
}

export default ImageCanvas

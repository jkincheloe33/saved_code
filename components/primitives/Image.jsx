import PropTypes from 'prop-types'
import styled from 'styled-components'

const Img = styled.img`
  max-width: 100%;
  vertical-align: bottom;
  width: ${p => p.width ?? 'auto'};
`

const Image = ({ alt, className, onClick, src, width, ...props }) => (
  <Img {...props} alt={alt} className={className} onClick={onClick} src={src} width={width} />
)

Image.propTypes = {
  alt: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  src: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default Image

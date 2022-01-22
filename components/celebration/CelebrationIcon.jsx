import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'

import { gradients } from '@assets'
import { Image } from '@components'

const spin = keyframes`
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
`

const IconBackground = styled.div`
  align-items: center;
  background: ${p => p.showBackground && gradients.blurple};
  border-radius: 50%;
  display: flex;
  height: ${p => p.iconWidth ?? 'auto'};
  justify-content: center;
  margin-bottom: ${p => `${p.margin}px`};
  position: relative;
  width: ${p => p.iconWidth ?? 'auto'};
`

const Icon = styled(Image)`
  justify-self: center;
  height: ${p => p.width ?? 'auto'};
  margin: 0 auto;
  width: ${p => p.width ?? 'auto'};

  &:hover {
    animation: ${spin} 2000ms linear infinite;
  }
`

const CelebrationIcon = ({ alt, iconWidth, margin = '0', showBackground = false, src, width }) => (
  <IconBackground iconWidth={iconWidth} margin={margin} showBackground={showBackground} src={src}>
    <Icon alt={alt} src={src} width={width} />
  </IconBackground>
)

CelebrationIcon.propTypes = {
  alt: PropTypes.string.isRequired,
  iconWidth: PropTypes.string,
  margin: PropTypes.string,
  showBackground: PropTypes.bool,
  src: PropTypes.string.isRequired,
  width: PropTypes.string,
}

export default CelebrationIcon

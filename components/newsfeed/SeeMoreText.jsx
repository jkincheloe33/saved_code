import { useEffect, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { colors } from '@assets'
import { Text } from '@components'
import { countLines, uId } from '@utils'

export const Wrapper = styled(Text)`
  background-color: ${p => p.backgroundColor ?? colors.white};
  bottom: 0;
  cursor: pointer;
  display: ${p => (p.lines <= p.maxLines ? 'none' : 'block')};
  padding-left: 2px;
  position: absolute;
  right: 0;

  // Check for Safari because the line clamp causes Safari line to be offset, line-height normal resets it
  // Trying these 2 media query for now and will add if needed...JC
  /* Safari 10.1+ */
  @media not all and (min-resolution: 0.001dpcm) {
    line-height: normal;
  }

  /* Safari 6.1-10.0 (not 10.1) */
  @media screen and (min-color-index: 0) and(-webkit-min-device-pixel-ratio:0) {
    line-height: normal;
  }
`

const SeeMoreText = ({ backgroundColor, color, maxLines, targetEle, setMaxLines }) => {
  const [lineCount, setLineCount] = useState(null)

  useEffect(() => {
    const lineCount = countLines(targetEle)
    setLineCount(lineCount)
  }, [targetEle])

  return (
    <Wrapper
      backgroundColor={backgroundColor}
      color={color ?? 'gray3'}
      id={uId('see-more-text')}
      lines={lineCount}
      maxLines={maxLines}
      onClick={() => setMaxLines(1000)}
    >
      ...See more
    </Wrapper>
  )
}

SeeMoreText.propTypes = {
  backgroundColor: PropTypes.string,
  color: PropTypes.string,
  maxLines: PropTypes.number.isRequired,
  setMaxLines: PropTypes.func.isRequired,
  targetEle: PropTypes.string.isRequired,
}

export default SeeMoreText

import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CloseIcon, colors, multiplier } from '@assets'
import { Image, Text as TextBase } from '@components'

const CloseIconWrapper = styled.div`
  height: ${multiplier * 2}px;
  margin-left: auto;
  width: ${multiplier * 2}px;
`

const TagIconWrapper = styled.div`
  align-items: center;
  display: flex;
`

const TagWrapper = styled.div`
  align-items: center;
  background-color: ${colors.lightestPurple}99;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  margin: ${p => p.spacing};
  padding: ${multiplier}px ${multiplier * 2}px;
  width: auto;
`

const Text = styled(TextBase)`
  margin: 0 ${multiplier * 2}px 0 ${multiplier}px;
`

const Tag = ({ color = 'blurple', fontSize = '14px', handleDelete, icon, imageWidth = '14px', spacing = 0, text }) => (
  <TagWrapper onClick={handleDelete} spacing={spacing}>
    <TagIconWrapper>
      <Image alt='Tag icon' src={icon} width={imageWidth} />
    </TagIconWrapper>
    <Text color={color} fontSize={fontSize} noClamp>
      {text}
    </Text>
    <CloseIconWrapper>
      <CloseIcon color={colors[color]} />
    </CloseIconWrapper>
  </TagWrapper>
)

Tag.propTypes = {
  color: PropTypes.string,
  fontSize: PropTypes.string,
  handleDelete: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  imageWidth: PropTypes.string,
  spacing: PropTypes.string,
  text: PropTypes.string.isRequired,
}

export default Tag

import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, DownArrowIcon2, multiplier } from '@assets'
import { Image, Text } from '@components'

const TIMING = 250

const Arrow = styled(Image)`
  margin-left: auto;
  transform: ${p => p.active && 'rotate(-180deg)'};
  transition: transform ${TIMING}ms ease;
`

const DisplayText = styled(Text)`
  margin-right: ${multiplier}px;
`

const Icon = styled(Image)`
  margin-right: 10px;
  width: 17px;
`

const Wrapper = styled.div`
  align-items: center;
  background-color: ${p => (p.active ? colors.white : 'transparent')};
  border: 1px solid ${colors.gray5};
  border-radius: 22px;
  cursor: pointer;
  display: flex;
  margin: ${p => p.spacing};
  padding: 10px 15px;
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};

  &[disabled] {
    background-color: ${colors.gray7};
    box-shadow: none;
    color: ${colors.gray3};
  }
`

const DropdownButton = ({ active = false, disabled = false, displayText, icon, onClick, spacing = 0 }) => {
  return (
    <Wrapper active={active} disabled={disabled} onClick={onClick} spacing={spacing}>
      {icon && <Icon alt='Dropdown Icon' src={icon} />}
      <DisplayText color='coolGray' fontSize='14px'>
        {displayText}
      </DisplayText>
      {!disabled && <Arrow active={active} src={DownArrowIcon2} />}
    </Wrapper>
  )
}

DropdownButton.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  displayText: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  spacing: PropTypes.string,
}

export default DropdownButton

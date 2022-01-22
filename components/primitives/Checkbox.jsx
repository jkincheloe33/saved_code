import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Checkbox as BaseCheckbox, Checkmark } from '@accessible/checkbox'
import { colors, CheckmarkIcon1, CheckmarkIcon2 } from '@assets'

const StyledContainer = styled.label`
  align-items: center;
  cursor: ${p => p.noCursor ?? 'pointer'};
  display: flex;
  pointer-events: ${p => (p.clickable ? 'auto' : 'none')};

  // Set relative because of child input is set position absolute...CY
  position: relative;
  user-select: none;
  vertical-align: middle;
`

const StyledCheckbox = styled.span`
  align-items: center;
  background-color: ${p => colors[p.color] ?? colors.lightBlue};
  border-radius: 7px;
  display: flex;
  height: 24px;
  justify-content: center;
  margin: ${p => p.spacing ?? 0};
  min-width: 24px;
  width: 24px;

  .checked {
    background-color: transparent;
  }

  .unchecked {
    opacity: 0;
    transition: opacity 200ms linear;
  }
`

const Checkbox = ({ checked, children, className, color, defaultChecked, id, name, noCursor, onChange, spacing, whiteCheckmark }) => (
  <StyledContainer className={className} clickable={!!onChange} id={id} noCursor={noCursor}>
    <BaseCheckbox checked={checked} defaultChecked={defaultChecked} name={name} onChange={onChange}>
      <StyledCheckbox checked={checked} color={color} spacing={spacing}>
        <Checkmark checkedClass='checked' uncheckedClass='unchecked'>
          <img src={whiteCheckmark ? CheckmarkIcon2 : CheckmarkIcon1} alt='check icon' />
        </Checkmark>
      </StyledCheckbox>
    </BaseCheckbox>
    {children}
  </StyledContainer>
)

Checkbox.propTypes = {
  checked: PropTypes.bool,
  children: PropTypes.any,
  className: PropTypes.string,
  color: PropTypes.string,
  defaultChecked: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  noCursor: PropTypes.bool,
  onChange: PropTypes.func,
  spacing: PropTypes.string,
  whiteCheckmark: PropTypes.bool,
}

export default Checkbox

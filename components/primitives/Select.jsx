import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, DownArrowIcon1 } from '@assets'

const StyledSelect = styled.select`
  background: url(${DownArrowIcon1});
  background-color: ${colors.white};
  background-position: calc(100% - 25px) center;
  background-repeat: no-repeat;
  border: 0.75px solid ${colors.gray5};
  border-radius: 12px;
  color: ${colors.gray1};
  cursor: pointer;
  font-size: 16px;
  padding: 13px 25px;
  width: 100%;
  -webkit-appearance: none;

  &:focus {
    outline: 0;
  }
`

const Select = ({ className, defaultValue, id, onChange, options, required, title, type = 'text', value, ...props }) => {
  return (
    <StyledSelect
      {...props}
      className={className}
      defaultValue={defaultValue}
      id={id}
      onChange={onChange}
      required={required}
      type={type}
      value={value}
    >
      {title && (
        <option disabled value={''}>
          {title}
        </option>
      )}
      {options.map((option, i) => (
        <option key={i} value={option.value}>
          {option.name}
        </option>
      ))}
    </StyledSelect>
  )
}

Select.propTypes = {
  className: PropTypes.string,
  defaultValue: PropTypes.any,
  id: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array.isRequired,
  required: PropTypes.bool,
  title: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.any,
}

export default Select

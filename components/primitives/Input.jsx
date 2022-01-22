import { forwardRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Image } from '@components'
import { useLangContext } from '@contexts'

const Field = styled.div`
  position: relative;
  width: 100%;
`

const Icon = styled(Image)`
  cursor: pointer;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`

// prettier-ignore
const Label = styled.label`
  color: ${colors.gray3};
  display: inline-block;
  font-size: 16px;
  line-height: 16px;
  pointer-events: none;
  transform: translateY(22px);
  transform-origin: bottom left;
  transition: all 150ms ease;

  // Labels are required for ADA complicance, but are allowed to be visually hidden...JK
  ${p => !p.visible && `
    display: inherit;
    height: 0;
    visibility: hidden;
    width: 0;
  `}

  ${p => p.focused && `
    transform: scale(0.87) translateY(0);
  `}
`

// prettier-ignore
const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  color: ${p => colors[p.color] ?? colors.gray1};
  width: 100%;
  font-size: 16px;
  line-height: 16px;
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
  white-space: nowrap;

  -webkit-appearance: none;

  &::placeholder {
    color: ${colors.gray3};

    ${p => p.showLabel && `
      font-size: 14px;
      opacity: 0;
    `}
  }

  &:focus {
    outline: 0;

    &::placeholder {
      opacity: 1;
    }
  }
`

// prettier-ignore
const Wrapper = styled.div`
  border-bottom: ${p => (p.border ? `0.5px solid ${colors.gray5}` : 'none')};
  margin: ${p => p.spacing ?? 0};
  padding: ${p => (p.border ? '5px 0' : '0')};
  position: relative;
  width: 100%;

  ${p => p.columns && `
    flex: 0 1 ${(p.columns / 12) * 100}%;
  `}
`

const Input = forwardRef(
  (
    {
      autoCapitalize = 'on',
      border = false,
      className,
      color,
      columns,
      handleAction,
      icon,
      id,
      label,
      onBlur = () => {},
      onFocus = () => {},
      required = false,
      showLabel = false,
      spacing,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const { getText } = useLangContext()

    const handleBlur = () => {
      if (onBlur) onBlur()
      setFocused(false)
    }

    const handleFocus = () => {
      if (onFocus) onFocus()
      setFocused(true)
    }

    return (
      <Wrapper border={border} className={className} columns={columns} spacing={spacing}>
        <Label
          htmlFor={label}
          focused={focused || (props.value != null && (type === 'number' || props.value.length > 0))}
          visible={showLabel}
        >
          {getText(label)}
        </Label>
        <Field>
          <StyledInput
            {...props}
            autoCapitalize={autoCapitalize}
            color={color}
            id={id || label}
            onBlur={() => handleBlur()}
            onFocus={() => handleFocus()}
            ref={ref}
            required={required}
            showLabel={showLabel}
            type={type}
          />
          {icon && <Icon alt={`${getText(label)} icon`} border={border} onClick={handleAction} src={icon} />}
        </Field>
      </Wrapper>
    )
  }
)

Input.propTypes = {
  autoCapitalize: PropTypes.string,
  border: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.string,
  columns: PropTypes.number,
  handleAction: PropTypes.func,
  icon: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  required: PropTypes.bool,
  showLabel: PropTypes.bool,
  spacing: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

Input.displayName = 'Input'

export default Input

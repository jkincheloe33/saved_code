import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CloseIcon, colors, SearchIcon } from '@assets'
import { Input } from '@components'

const BarWrapper = styled.div`
  align-items: center;
  background-color: ${p => colors[p.bgColor] ?? colors.gray8};
  border-radius: 20px;
  flex: 1 1 auto;
  display: flex;
  max-width: ${p => (p.full ? 'none' : '400px')};
  padding: 7.5px 15px;
  width: 100%;

  input {
    flex: 1 0 auto;
    margin-left: 10px;
  }

  svg {
    width: 17px;
  }
`

const CloseWrapper = styled.div`
  cursor: pointer;
  display: flex;
  padding: 10px;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);

  svg {
    height: 15px;
    width: 15px;
  }
`

const Wrapper = styled.div`
  margin: 0 auto;
  position: relative;
  width: calc(100% - 40px);

  ${p => p.width && `width: ${p.width}`}
`

const SearchBar = ({
  autoComplete = 'off',
  autoFocus = false,
  bgColor,
  className,
  full = false,
  handleClear,
  id,
  label,
  onChange,
  placeholder,
  value,
  width,
  ...props
}) => (
  <Wrapper width={width}>
    <BarWrapper bgColor={bgColor} className={className} full={full}>
      <SearchIcon />
      <Input
        {...props}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        id={id}
        label={label || placeholder}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </BarWrapper>
    {handleClear && value.length > 0 && (
      <CloseWrapper onClick={handleClear}>
        <CloseIcon color={colors.gray1} />
      </CloseWrapper>
    )}
  </Wrapper>
)

SearchBar.propTypes = {
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  bgColor: PropTypes.string,
  className: PropTypes.string,
  full: PropTypes.bool,
  handleClear: PropTypes.func,
  id: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  width: PropTypes.string,
}

export default SearchBar

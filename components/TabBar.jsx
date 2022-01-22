import styled from 'styled-components'
import PropTypes from 'prop-types'

import { colors } from '@assets'
import { Text } from '@components'
import { uId } from '@utils'

const Wrapper = styled.ul`
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  width: 100%;
`

const OptionInfo = styled.li`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex: 0 0 ${p => 100 / p.optionLength}%;
  flex-direction: column;
  justify-content: center;
  list-style: none;

  &::after {
    content: '';
    border-bottom: 2px solid ${p => (p.selected ? colors.blurple : colors.transparent)};
    border-radius: 2px;
    margin: 14px auto 0;
    min-width: 24px;
  }
`

const TabBar = ({ options, selected, setSelected }) => {
  return (
    <Wrapper>
      {options.map((option, index) => {
        const active = option.key ? selected === option.key : selected === index
        return (
          <OptionInfo
            id={option.id ? `${option.id}` : option.name ? `tab-${uId(option.name)}` : `tab-${uId(option)}`}
            key={index}
            optionLength={options.length}
            selected={active}
            onClick={() => {
              setSelected(option.key ?? index)
            }}
          >
            <Text color={active ? 'blurple' : 'gray3'} fontWeight={active ? 700 : 400}>
              {option.name || option}
            </Text>
          </OptionInfo>
        )
      })}
    </Wrapper>
  )
}

// Options is an array of strings or objects (eg. ['Elevation', 'Values', 'Patient Voice'])...CY
// NOTE: If an array of objects is specified, provide an optional key to match data structure,
// a name to render, and an optional id. Otherwise, index and id will be defaulted...JC
TabBar.propTypes = {
  options: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.arrayOf(PropTypes.string)]),
  selected: PropTypes.number.isRequired,
  setSelected: PropTypes.func.isRequired,
}

export default TabBar

import { useRef, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { colors, DownArrowIcon1, shadows } from '@assets'
import { Text } from '@components'
import { useLangContext } from '@contexts'
import { handleClickOut, LANGUAGE_TYPE } from '@utils'

const Filter = styled.div`
  border-radius: 20px;
  cursor: pointer;
  display: flex;
`

const ClosedFilter = styled(Filter)`
  align-items: center;
  align-self: flex-start;
  background: url(${DownArrowIcon1});
  background-color: ${colors.gray8};
  background-position: calc(100% - 20px) center;
  background-repeat: no-repeat;
  color: ${colors.gray1};
  height: 37px;
  margin: auto 0;
  padding: 0 45px 0 20px;
`

const Label = styled(Text)`
  margin: 10px 0px 10px 10px;
`

const OpenFilter = styled(Filter)`
  background-color: ${colors.white};
  box-shadow: ${shadows.challenge};
  flex-direction: column;
  height: 320px;
  padding: 10px 20px;
  position: absolute;
  top: -10px;
  width: 206px;
`

const Option = styled.div`
  background: ${p => (p.isSelected ? 'rgba(102, 77, 255, 0.22)' : colors.gray8)};
  border-radius: 8px;
  color: ${colors.gray1};
  font-size: 16px;
  margin-top: 8px;
  padding: 6px;
  width: 90%;

  &:not(:last-of-type) {
    margin-bottom: 8px;
  }
`

const Wrapper = styled.div`
  position: relative;
  z-index: 1;
`

const BrowseWambiFilter = ({ setDropdownFilter }) => {
  const ref = useRef(null)
  const { getAccountLanguage } = useLangContext()

  const [filter, setFilter] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  handleClickOut(ref, () => {
    setIsOpen(false)
  })

  const setOption = option => {
    if (option === filter) {
      setDropdownFilter('')
      setFilter(null)
    } else {
      setDropdownFilter(option)
      setFilter(option)
    }
    setIsOpen(false)
  }

  return (
    <Wrapper>
      {isOpen ? (
        <OpenFilter isOpen={isOpen} ref={ref}>
          <Text color='gray1' fontSize='14px' fontWeight='600'>
            Filter
          </Text>
          <Label fontSize='14px'>Sent by</Label>
          <Option
            id='review-cpc-filter-patient'
            isSelected={filter === getAccountLanguage(LANGUAGE_TYPE.PATIENT)}
            onClick={() => setOption(getAccountLanguage(LANGUAGE_TYPE.PATIENT))}
          >
            {getAccountLanguage(LANGUAGE_TYPE.PATIENT)}
          </Option>
          <Option id='review-cpc-filter-team-member' isSelected={filter === 'Team Member'} onClick={() => setOption('Team Member')}>
            Team Member
          </Option>
          <Label fontSize='14px'>Sent to</Label>
          <Option id='review-cpc-filter-group' isSelected={filter === 'Group'} onClick={() => setOption('Group')}>
            Group
          </Option>
          <Option id='review-cpc-filter-individual' isSelected={filter === 'Individual'} onClick={() => setOption('Individual')}>
            Individual
          </Option>
        </OpenFilter>
      ) : (
        <ClosedFilter onClick={() => setIsOpen(true)}>{filter ?? 'Filter'}</ClosedFilter>
      )}
    </Wrapper>
  )
}

BrowseWambiFilter.propTypes = {
  setDropdownFilter: PropTypes.func.isRequired,
}

export default BrowseWambiFilter

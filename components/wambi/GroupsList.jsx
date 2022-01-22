import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { PeopleSelection } from '@components'

const GroupsPeopleSelection = styled(PeopleSelection)`
  border-bottom: 1px solid ${colors.gray7}B3;
  padding-bottom: 0;
  // removes the 20px of padding from Suggested and PeopleSelection components...PS
  margin-bottom: -20px;
`

const GroupsList = ({ getPeopleInGroups, groupsList, selected }) => (
  <>
    {groupsList && groupsList.length > 0 && (
      <GroupsPeopleSelection getPeopleInGroups={getPeopleInGroups} list={groupsList} multiSelect selected={selected} title='Suggested' />
    )}
  </>
)

GroupsList.propTypes = {
  getPeopleInGroups: PropTypes.func,
  groupsList: PropTypes.array,
  selected: PropTypes.array.isRequired,
}

export default GroupsList

import PropTypes from 'prop-types'
import styled from 'styled-components'

import { PeopleSelection, Suggested, Text } from '@components'
import { useProfileContext } from '@contexts'

const NoResults = styled(Text)`
  margin-top: 30px;
  text-align: center;
`

const SearchList = ({ handleClear = () => {}, giftId, handleSelect, searchFocused = true, searchInput, searchList }) => {
  const { setSelectedProfileId, setProfileType, setShowProfile } = useProfileContext()

  const handleOpen = profile => {
    if (handleSelect) return handleSelect(profile)

    if (profile) {
      setShowProfile(true)
      setSelectedProfileId(profile.id)
      setProfileType(profile.type)
      // setTimeout gives the workflow time to translate to the next page before clearing...KA
      setTimeout(handleClear, 500)
    }
  }

  return (
    <>
      {searchFocused && (
        <>
          {searchList?.length === 0 && <NoResults fontWeight={700}>No profile matching that name was found.</NoResults>}
          {searchList?.length > 0 && <PeopleSelection handleSelect={handleOpen} list={searchList} searchInput={searchInput} />}
          {(!searchList || searchList?.length === 0 || !searchInput) && <Suggested giftId={giftId} handleSelect={handleOpen} />}
        </>
      )}
    </>
  )
}

SearchList.propTypes = {
  giftId: PropTypes.number,
  handleClear: PropTypes.func,
  handleSelect: PropTypes.func,
  searchInput: PropTypes.string,
  searchList: PropTypes.array,
  searchFocused: PropTypes.bool,
}

export default SearchList

import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { DirectReports, GroupsList, Loader, PeopleSelection, Suggested } from '@components'
import { coreApi } from '@services'

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const RecentlySent = styled(PeopleSelection)`
  padding: 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${colors.gray7}B3;
  }
`

const DefaultWambiView = ({ getPeopleInGroups, handleSelect, selected, setActive }) => {
  const [directReports, setDirectReports] = useState([])
  const [groupsList, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [recentlySent, setRecentlySent] = useState([])
  const [suggested, setSuggested] = useState([])

  useEffect(() => {
    // formats the group name into initials and adds a thumbnailImage property to be used in PeopleSelection...PS & JK
    const formatGroupName = groups => setGroups(groups.map(group => ({ ...group, thumbnailImage: group.name[0] })))

    const loadViews = async () => {
      try {
        const [
          {
            data: { userOwnedGroups, success: groupDataSuccess },
          },
          {
            data: { directReports, success: directReportsSuccess },
          },
          {
            data: { recentlySent, success: recentlySentSuccess },
          },
          {
            data: { suggestedPeople, success: suggestedSuccess },
          },
        ] = await Promise.all([
          coreApi.get('/manager/getOwnedGroups'),
          coreApi.get('/wambi/getDirectReports'),
          coreApi.get('/wambi/getRecentlySent'),
          coreApi.get('/wambi/getSuggested'),
        ])
        if (groupDataSuccess) formatGroupName(userOwnedGroups)
        if (directReportsSuccess) setDirectReports(directReports)
        if (recentlySentSuccess) setRecentlySent(recentlySent)
        if (suggestedSuccess) setSuggested(suggestedPeople)
        setIsLoading(false)
      } catch (error) {
        console.error(error)
      }
    }
    loadViews()
  }, [])

  return (
    <>
      {isLoading ? (
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      ) : (
        <>
          <GroupsList getPeopleInGroups={getPeopleInGroups} groupsList={groupsList} multiSelect selected={selected} setActive={setActive} />
          <Suggested groupsList={groupsList} handleSelect={handleSelect} multiSelect prefetchedData={suggested} selected={selected} />
          {directReports.length > 0 && (
            <DirectReports handleSelect={handleSelect} multiSelect prefetchedData={directReports} selected={selected} />
          )}
          {recentlySent.length > 0 && (
            <div>
              {recentlySent.map((rs, i) => (
                <RecentlySent
                  groupSelect
                  handleSelect={handleSelect}
                  key={i}
                  list={rs}
                  multiSelect
                  selected={selected}
                  title={i === 0 ? 'Recently Sent' : null}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

DefaultWambiView.propTypes = {
  getPeopleInGroups: PropTypes.func,
  handleSelect: PropTypes.func.isRequired,
  selected: PropTypes.array.isRequired,
  setActive: PropTypes.func,
}

export default DefaultWambiView

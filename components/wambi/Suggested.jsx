import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Loader, PeopleSelection } from '@components'
import { api } from '@services'

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const Wrapper = styled.div`
  padding: 10px 0;
`

const Suggested = ({ giftId, groupsList, handleSelect, multiSelect = false, prefetchedData, selected }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [suggested, setSuggested] = useState([])

  const suggestedResults = Boolean(prefetchedData?.length || suggested?.length)

  useEffect(() => {
    const endPoint = giftId ? '/reward/getSuggested' : '/core/wambi/getSuggested'
    if (!prefetchedData) {
      setIsLoading(true)
      const loadSuggested = async () => {
        const {
          data: { success, suggestedPeople },
        } = await api.post(endPoint, { giftId })

        if (success) setSuggested(suggestedPeople)
        setIsLoading(false)
      }
      loadSuggested()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchedData])

  return (
    <>
      {isLoading ? (
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      ) : (
        suggestedResults && (
          <Wrapper>
            {prefetchedData?.length ? (
              <PeopleSelection
                handleSelect={handleSelect}
                list={prefetchedData}
                multiSelect={multiSelect}
                selected={selected}
                title={groupsList.length === 0 && 'Suggested'}
              />
            ) : (
              <PeopleSelection handleSelect={handleSelect} list={suggested} multiSelect={multiSelect} selected={selected} />
            )}
          </Wrapper>
        )
      )}
    </>
  )
}

Suggested.propTypes = {
  giftId: PropTypes.number,
  groupsList: PropTypes.array,
  handleSelect: PropTypes.func.isRequired,
  multiSelect: PropTypes.bool,
  prefetchedData: PropTypes.array,
  selected: PropTypes.array,
}

export default Suggested

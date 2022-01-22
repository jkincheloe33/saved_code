import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { coreApi } from '@services'

import { PeopleSelection } from '@components'

const Wrapper = styled.div`
  padding: 10px 0;
`

const DirectReports = ({ handleSelect, prefetchedData, selected }) => {
  const [directReports, setDirectReports] = useState([])

  useEffect(() => {
    const loadDirectReports = async () => {
      const {
        data: { directReports, success },
      } = await coreApi.get('/wambi/getDirectReports')

      if (success) setDirectReports(directReports)
    }

    if (prefetchedData) setDirectReports(prefetchedData)
    else loadDirectReports()
  }, [prefetchedData])

  return (
    <Wrapper>
      {directReports && directReports.length > 0 && (
        <PeopleSelection
          groupSelect
          handleSelect={handleSelect}
          list={directReports}
          multiSelect
          selected={selected}
          title='Direct reports'
        />
      )}
    </Wrapper>
  )
}

DirectReports.propTypes = {
  handleSelect: PropTypes.func.isRequired,
  prefetchedData: PropTypes.array,
  selected: PropTypes.array.isRequired,
}

export default DirectReports

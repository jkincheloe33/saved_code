import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useRouter } from 'next/router'

import { devices, shadows } from '@assets'
import { Card, Container, Intro, LocationModal, LocationTile, Modal, PortalLayout, SearchBar, Text } from '@components'
import { useLangContext } from '@contexts'
import { api } from '@services'
import { useStore } from '@utils'

const LocationCard = styled(Card)`
  margin: 1rem auto;
  padding: 1rem 1rem;

  @media (${devices.mobile}) {
    padding: 1rem 2rem;
  }
`

const NoResults = styled(Text)`
  margin: 2rem 0 1rem;
  text-align: center;
`

const Search = styled(SearchBar)`
  border-radius: 12px;
  box-shadow: ${shadows.input};
  margin-top: 1rem;
  padding: 1rem;
`

const StyledContainer = styled(Container)`
  max-width: 800px;
`

const LocationSearch = ({ portalScreens, query, reviewData, setActive, setReviewData }) => {
  const { getText } = useLangContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [locationsList, setLocationsList] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [setStore, { portalState }] = useStore()
  const { isReady } = useRouter()

  useEffect(() => {
    if (isReady) {
      const getLocations = async () => {
        const {
          data: { locations, shortUid, success },
        } = await api.get(`/portal/location/list?id=${query.id || ''}`)

        if (success) {
          setReviewData(data => ({ ...data, portalId: shortUid }))

          setStore({
            portalState: { ...portalState, location: { ...reviewData.location, disableTranslations: locations[0].disableTranslations } },
          })

          if (locations.length === 1) {
            setReviewData(data => ({ ...data, location: locations[0] }))
            setActive(portalScreens.LOGIN)
          } else {
            setLocationsList(locations)
          }
        }
      }

      getLocations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleSearch = e => {
    setSearchTerm(e)
    if (e.length > 2) {
      const lowercaseVal = e.toLowerCase()
      const matchingLocations = locationsList.filter(
        l =>
          (l.name && l.name.toLowerCase().includes(lowercaseVal)) ||
          (l.shortTitle && l.shortTitle.toLowerCase().includes(lowercaseVal)) ||
          (l.longTitle && l.longTitle.toLowerCase().includes(lowercaseVal))
      )
      setSearchResults(matchingLocations)
    } else {
      setSearchResults([])
    }
  }

  const handleNextClick = async () => {
    await setStore({ portalState: { ...portalState, location: reviewData.location } })
    setActive(portalScreens.LOGIN)
  }

  return (
    <PortalLayout>
      <StyledContainer>
        <Intro squiggly='right' text={getText('Recognize the people who')} text2={getText('impacted your experience')} />
        <Search
          autoFocus
          bgColor='white'
          full
          id='portal-location-searchbar'
          onChange={e => handleSearch(e.target.value)}
          placeholder={getText('Search location')}
          value={searchTerm}
        />
        {searchTerm.length > 2 && !searchResults.length && (
          <NoResults color='darkBlue' noClamp>
            {getText('No results found!')}
            <br />
            {getText('Please try another search or choose from our featured facilities below')}
          </NoResults>
        )}
        <LocationCard borderRadius='12px'>
          {searchResults.length && searchTerm
            ? searchResults.map((r, i) => (
                <LocationTile
                  handleClick={() => {
                    setReviewData(data => ({ ...data, location: r }))
                    setIsModalOpen(true)
                  }}
                  key={i}
                  location={r}
                  thumbnail
                />
              ))
            : locationsList.map((l, i) => (
                <LocationTile
                  handleClick={() => {
                    setReviewData(data => ({ ...data, location: l }))
                    setIsModalOpen(true)
                  }}
                  key={i}
                  location={l}
                  thumbnail
                />
              ))}
        </LocationCard>
      </StyledContainer>
      <Modal
        animationType='slideUp'
        handleClose={() => {
          setIsModalOpen(false)
          setReviewData(data => ({ ...data, location: null }))
        }}
        open={isModalOpen}
        small
      >
        <LocationModal location={reviewData.location} onClick={() => handleNextClick()} />
      </Modal>
    </PortalLayout>
  )
}

LocationSearch.propTypes = {
  portalScreens: PropTypes.object,
  query: PropTypes.object,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
}

export default LocationSearch

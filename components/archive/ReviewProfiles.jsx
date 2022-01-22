import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { AllClearImage, CameraCheckIcon, colors, devices } from '@assets'
import {
  Avatar,
  Banner,
  Checkbox,
  CtaFooter,
  DynamicContainer,
  Image,
  InitialsBox,
  Layout,
  Loader,
  Modal,
  Paragraph,
  PillButton,
  SearchBar,
  Text,
  ZoomPinch,
} from '@components'
import { api } from '@services'
import { uId } from '@utils'

const AllClearWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 23px;

  img {
    margin: 62px auto;
    width: 120px;
  }
`

const BannerRow = styled.div`
  display: flex;
  padding: 16px 30px;

  img {
    margin: auto 14px auto 0;
    width: 32px;
  }
`

const FooterPill = styled(PillButton)`
  width: 48%;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: none;
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const NoResultsText = styled(Text)`
  margin-top: 20px;
  text-align: center;
`

const PeopleWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const PersonInner = styled.div`
  display: flex;
  flex: 1;
`

const PersonRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 22px 0;
`

const PersonText = styled.div`
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: auto 34px;
  width: 100%;
`

const Photo = styled(Avatar)`
  border-radius: 16px;
`

const SearchWrapper = styled.div`
  flex: 1;
  margin-right: 20px;
  position: relative;
  width: 100%;

  input {
    font-size: 15px;
  }
`

const TopWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;

  ${Text} {
    cursor: pointer;
    margin: auto 0;
  }
`

const Wrapper = styled(DynamicContainer)`
  display: flex;
  flex-direction: column;
  padding: 28px 20px 150px;

  @media (${devices.largeDesktop}) {
    width: 475px;
  }
`

const ReviewProfiles = ({ handleBack }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState('')
  const [profiles, setProfiles] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const getProfiles = async () => {
      const { data } = await api.get('manager/getPendingProfiles')

      if (data.success) {
        setProfiles(data.profiles)
        setIsLoading(false)
      }
    }

    getProfiles()
  }, [])

  const handleApprove = async () => {
    setSubmitting(true)
    const { data } = await api.post('manager/approveProfiles', { profiles: selected })

    if (data.success) {
      setProfiles(profiles => profiles.filter(p => !selected.includes(p.id)))
      setSearchResults([])
      setSelected([])
    }
    setSubmitting(false)
  }

  const handleDeny = async () => {
    const { data } = await api.post('manager/denyProfiles', { changesRequested: 'daddy chill', profiles: selected })

    if (data.success) {
      setProfiles(profiles => profiles.filter(p => !selected.includes(p.id)))
      setSearchResults([])
      setSelected([])
    }
  }

  const handleClear = () => {
    setSearchInput('')
    setSearchResults([])
  }

  const handleSearch = async e => {
    const input = e.target.value.toLowerCase()
    setSearchInput(input)

    if (input.length > 2) {
      const matchingResults = profiles.filter(
        p =>
          (p.displayName && p.displayName.toLowerCase().includes(input)) ||
          (p.draftDisplayName && p.draftDisplayName.toLowerCase().includes(input))
      )
      setSearchResults(matchingResults)
    } else {
      setSearchResults([])
    }
  }

  const handleSelectAll = () => {
    if (selected.length === profiles.length) setSelected([])
    else setSelected(profiles.map(p => p.id))
  }

  const handleSelectSingle = id => {
    const exists = selected.includes(id)

    if (exists) {
      setSelected(selected => selected.filter(s => s !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  const renderProfiles = () => {
    let profilesArray = []

    if (searchInput.length > 2 && searchResults.length) {
      profilesArray = [...searchResults]
    } else if (searchInput.length > 2 && !searchResults.length) {
      return (
        <NoResultsText fontSize='18px' color='gray1'>
          No team members found.
        </NoResultsText>
      )
    } else {
      profilesArray = [...profiles]
    }

    return (
      <PeopleWrapper>
        {profilesArray.map(({ displayName, draftDisplayName, id, pendingThumbnail, thumbnailImage }, i) => (
          <PersonRow key={i}>
            <PersonInner>
              {pendingThumbnail || thumbnailImage.length > 2 ? (
                <Photo
                  image={pendingThumbnail || thumbnailImage}
                  onClick={() => setPreviewImage(pendingThumbnail || thumbnailImage)}
                  ratio='100px'
                  shadow
                />
              ) : (
                <InitialsBox fontSize='40px' height='100px' initials={thumbnailImage} radius='16px' width='100px' />
              )}
              <PersonText onClick={() => handleSelectSingle(id)}>
                <Text color='gray1' fontSize='20px' fontWeight={700} noClamp>
                  {draftDisplayName || displayName}
                </Text>
                <Text noClamp>
                  {pendingThumbnail && draftDisplayName ? 'Updated name and photo' : pendingThumbnail ? 'Updated photo' : 'Updated name'}
                </Text>
              </PersonText>
            </PersonInner>
            <Checkbox checked={selected.includes(id)} id={uId('profile')} onChange={() => handleSelectSingle(id)} />
          </PersonRow>
        ))}
      </PeopleWrapper>
    )
  }

  return (
    <>
      <Layout
        cta={{ onClick: handleBack, text: 'Close' }}
        handleBack={handleBack}
        id='review-profiles'
        inner
        loading={isLoading}
        noFooter
        title='Review profile changes'
      >
        <Wrapper outer>
          {profiles.length > 0 && (
            <TopWrapper>
              <SearchWrapper>
                <SearchBar
                  full
                  handleClear={handleClear}
                  id='review-profiles-searchbar'
                  onChange={handleSearch}
                  placeholder='Search your group'
                  value={searchInput}
                />
              </SearchWrapper>
              <Text color='blurple' onClick={handleSelectAll}>
                {profiles && selected.length === profiles.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TopWrapper>
          )}
          {profiles.length ? (
            <>
              {renderProfiles()}
              <CtaFooter>
                <FooterPill
                  disabled={selected.length === 0}
                  id='deny-profile-change-btn'
                  inverted
                  onClick={handleDeny}
                  text={selected.length ? `Deny (${selected.length})` : 'Deny'}
                />
                <FooterPill
                  disabled={selected.length === 0}
                  id='approve-profile-change-btn'
                  onClick={handleApprove}
                  text={selected.length ? `Approve (${selected.length})` : 'Approve'}
                />
              </CtaFooter>
            </>
          ) : (
            <AllClearWrapper>
              <Image alt='all-clear' src={AllClearImage} />
              <Banner title='All Clear!'>
                <BannerRow>
                  <Image alt='Text Case' src={CameraCheckIcon} />
                  <Paragraph fontSize='14px'>
                    When your team members upload new profile photos or edit their display names, you can review changes here.
                  </Paragraph>
                </BannerRow>
              </Banner>
            </AllClearWrapper>
          )}
        </Wrapper>
      </Layout>
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
      <Modal animationType='fadeIn' handleClose={() => setPreviewImage(null)} open={!!previewImage}>
        {previewImage && <ZoomPinch image={{ alt: 'Image under review', src: previewImage }} />}
      </Modal>
    </>
  )
}

ReviewProfiles.propTypes = {
  handleBack: PropTypes.func.isRequired,
}

export default ReviewProfiles

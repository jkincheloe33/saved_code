import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { Anchor, Card, InitialsBox, PillButton, Text } from '@components'
import { useLangContext, usePostContext, useProfileContext } from '@contexts'
import { LANGUAGE_TYPE, USER_STATUS } from '@utils'

const ButtonWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
`

const Image = styled.div`
  background-image: url(${p => p.image});
  background-position: center center;
  background-size: cover;
  border-radius: 20px;
  height: 112px;
  max-width: 112px;
  width: 100%;
`

const InitialsBoxWrapper = styled.div`
  border-radius: 20px;
  min-width: 112px;
  overflow: hidden;
`

const PersonInfo = styled.div`
  padding-left: 1rem;
  width: 100%;
`
const PersonName = styled(Text)`
  margin-bottom: 0.5rem;
`

const ProfileWrapper = styled.div`
  display: flex;
`

const SendCPCPill = styled(PillButton)`
  margin: 20px 9px 0 0;
`

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
`

// prettier-ignore
const Wrapper = styled(Card)`
  margin-bottom: 45px;
  padding: 20px;

  @media (${devices.mobile}) {
    margin-bottom: 40px;
  }

  @media (${devices.largeDesktop}) {
    ${p => p.myProfile && `
      box-shadow: none;
      margin-bottom: 0;
      padding: 0;
    `}
  }
`

const PersonInfoWidget = ({ myProfile, profile }) => {
  const { getAccountLanguage } = useLangContext()
  const { setSelectedRecipient, setShowSendCpc, setSkipCpcSearch } = usePostContext()
  const { setShowEditProfile, setShowProfile } = useProfileContext()

  const { groupName, isSelfRegistered, jobTitle, name, pronouns, status, thumbnailImage } = { ...profile }

  const handleSendCpc = () => {
    setSelectedRecipient(profile)
    setShowSendCpc(true)
    setSkipCpcSearch(true)
  }

  return (
    <Wrapper myProfile={myProfile}>
      <ProfileWrapper>
        {thumbnailImage?.length === 2 ? (
          <InitialsBoxWrapper>
            <InitialsBox fontSize='44px' height='112px' initials={thumbnailImage} width='112px' />
          </InitialsBoxWrapper>
        ) : (
          <Image image={thumbnailImage} />
        )}
        <PersonInfo>
          <TextWrapper>
            <PersonName color='coolGray' fontSize='18px'>
              {name}
              {pronouns && <Text fontSize='14px'>({pronouns})</Text>}
            </PersonName>
            <Text fontSize='14px'>
              {isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}
              {jobTitle ?? ''}
            </Text>
            <Text fontSize='14px'>{groupName}</Text>
            <ButtonWrapper>
              {myProfile && (
                <Anchor
                  color='blurple'
                  fontSize='14px'
                  fontWeight='600'
                  id='edit-profile-btn'
                  onClick={() => {
                    setShowProfile(false)
                    setShowEditProfile(true)
                  }}
                  text='Edit my profile'
                />
              )}
            </ButtonWrapper>
          </TextWrapper>
        </PersonInfo>
      </ProfileWrapper>
      {!myProfile && status !== USER_STATUS.DISABLED && (
        <SendCPCPill full id='profile-send-cpc-btn' onClick={handleSendCpc} text='Send a Wambi' thin />
      )}
    </Wrapper>
  )
}

PersonInfoWidget.propTypes = {
  myProfile: PropTypes.bool,
  profile: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
}

export default PersonInfoWidget

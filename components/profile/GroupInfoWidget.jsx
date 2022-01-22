import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Card, InitialsBox, PillButton, Text } from '@components'
import { usePostContext, useUserContext } from '@contexts'

const InitialsBoxWrapper = styled.div`
  margin-bottom: 0.5rem;
  min-width: 50px;
  overflow: hidden;
`

const GroupInfo = styled.div`
  padding-left: 1rem;
  width: 100%;
`
const GroupName = styled(Text)`
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

const Wrapper = styled(Card)`
  margin-bottom: 45px;
  padding: 20px;
`

const GroupInfoWidget = ({ groupPeople, profile }) => {
  const [disabled, setDisabled] = useState(true)

  const { setSelectedRecipient, setShowSendCpc, setSkipCpcSearch } = usePostContext()
  const { user } = useUserContext()

  const { groupName, name, thumbnailImage } = profile

  const handleSendCpc = () => {
    setSelectedRecipient(profile)
    setShowSendCpc(true)
    setSkipCpcSearch(true)
  }

  useEffect(() => {
    if (groupPeople.length > 0 && !(groupPeople.length === 1 && groupPeople[0].id === user.id)) setDisabled(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupPeople])

  return (
    <Wrapper>
      <ProfileWrapper>
        <InitialsBoxWrapper>
          <InitialsBox fontSize={'38px'} height='50px' initials={thumbnailImage} radius={'50%'} width={'50px'} />
        </InitialsBoxWrapper>

        <GroupInfo>
          <TextWrapper>
            <GroupName color='gray1' fontWeight='600' fontSize='20px' id='group-name'>
              {name}
            </GroupName>
          </TextWrapper>
        </GroupInfo>
      </ProfileWrapper>
      <Text fontSize={'15px'}>{groupName}</Text>
      <SendCPCPill disabled={disabled} full id='profile-send-cpc-btn' onClick={() => handleSendCpc()} text='Send a Wambi' thin />
    </Wrapper>
  )
}

GroupInfoWidget.propTypes = {
  groupPeople: PropTypes.array,
  profile: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default GroupInfoWidget

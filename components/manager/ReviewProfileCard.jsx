import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, multiplier } from '@assets'
import { Avatar as AvatarBase, Card as CardBase, Input, PillButton, Text } from '@components'
import { domRender, PROFILE_CHANGE_REQUEST_TYPE } from '@utils'

const Actions = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 0 ${multiplier * 3}px ${multiplier * 2}px;
  position: relative;
`

const ApproveButton = styled(PillButton)`
  margin-bottom: ${multiplier * 2}px;
`

const ApprovalContainer = styled.div`
  align-items: center;
  background-color: ${colors.white};
  display: flex;
  flex-wrap: wrap;
  height: calc(100% - ${multiplier * 2}px);
  justify-content: center;
  left: 0;
  opacity: ${p => (p.open ? 1 : 0)};
  padding: 0 ${multiplier * 3}px;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: absolute;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
`

const Avatar = styled(AvatarBase)`
  border-radius: 20px;
  flex: 0 0 112px;
`

const Card = styled(CardBase)`
  height: 100%;
`

const DenyButton = styled(PillButton)`
  width: 47%;
`

const DenyWrapper = styled.div`
  display: flex;
  flex: 0 0 100%;
  justify-content: space-between;
`

const Details = styled.div`
  align-items: center;
  display: flex;
  padding: ${multiplier * 2}px ${multiplier * 3}px;
`

const New = styled(Text)`
  text-transform: uppercase;
`

const ReportsTo = styled.div`
  border-bottom: 1px solid ${colors.gray7}B3;
  padding: ${multiplier * 2}px ${multiplier * 3}px;
`

const TextWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  padding-left: ${multiplier * 2}px;
`

const Wrapper = styled.div`
  flex: 0 0 100%;
  padding: ${multiplier * 2}px;

  @media (${devices.tablet}) {
    flex: 0 0 50%;
  }

  @media (${devices.xlDesktop}) {
    flex: 0 0 ${100 / 3}%;
  }

  @media (${devices.xxlDesktop}) {
    flex: 0 0 25%;
  }
`

const ReviewProfileCard = ({
  displayName,
  draftDisplayName,
  handleApprove,
  handleDeny,
  id,
  pendingThumbnail,
  profileRequestType,
  reportsTo,
  thumbnailImage,
}) => {
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const newText =
    profileRequestType === PROFILE_CHANGE_REQUEST_TYPE.NAME_AND_PHOTO
      ? 'New name and photo'
      : profileRequestType === PROFILE_CHANGE_REQUEST_TYPE.NAME_ONLY
      ? 'New name'
      : 'New photo'

  const approve = () => {
    setSubmitted(true)
    handleApprove()
  }

  const deny = () => {
    setShowReason(false)
    setSubmitted(true)
    handleDeny(reason, { id, profileRequestType })
  }

  // reset state if user hits cancel...JK
  const reset = () => {
    setReason('')
    setShowReason(false)
  }

  return (
    <Wrapper>
      <Card>
        <ReportsTo fontSize='14px'>{reportsTo ? domRender(`Reports to <b>${reportsTo}</b>`) : 'No direct manager'}</ReportsTo>
        <Details>
          <Avatar image={pendingThumbnail ?? thumbnailImage} ratio='112px' />
          <TextWrapper>
            <Text color='gray1' fontSize='18px' noClamp>
              {draftDisplayName ?? displayName}
            </Text>
            {draftDisplayName && (
              <Text color='gray1' noClamp>
                was {displayName}
              </Text>
            )}
            <New fontSize='14px' noClamp>
              {newText}
            </New>
          </TextWrapper>
        </Details>
        <Actions>
          <ApproveButton id={`approve-${id}`} onClick={approve} text='Approve' thin />
          <PillButton buttonType='secondary' id={`deny-${id}`} onClick={() => setShowReason(true)} text='Ask for changes' thin />
          <ApprovalContainer open={submitted || showReason}>
            {/* eslint-disable-next-line quotes */}
            {submitted && <Text fontSize='18px'>{reason.length ? "We'll let them know!" : 'Changes approved!'}</Text>}
            {showReason && (
              <>
                <Input border label='What needs to change?' onChange={e => setReason(e.target.value)} showLabel value={reason} />
                <DenyWrapper>
                  <DenyButton buttonType='secondary' id={`cancel-${id}`} onClick={reset} text='Cancel' thin />
                  <DenyButton disabled={!reason.length} id={`submit-changes-${id}`} onClick={deny} text='Submit' thin />
                </DenyWrapper>
              </>
            )}
          </ApprovalContainer>
        </Actions>
      </Card>
    </Wrapper>
  )
}

ReviewProfileCard.propTypes = {
  displayName: PropTypes.string,
  draftDisplayName: PropTypes.string,
  handleApprove: PropTypes.func.isRequired,
  handleDeny: PropTypes.func.isRequired,
  id: PropTypes.number,
  pendingThumbnail: PropTypes.string,
  profileRequestType: PropTypes.number,
  reportsTo: PropTypes.string,
  thumbnailImage: PropTypes.string,
}

export default ReviewProfileCard

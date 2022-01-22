import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CloseIcon as Close, colors, devices, multiplier } from '@assets'
import { Card, PillButton, Text, Title as TitleBase } from '@components'
import { usePostContext } from '@contexts'
import { FEED_ITEM_STATUS, FEED_ITEM_TYPES, handleClickOut, uId } from '@utils'

const Cta = styled(PillButton)`
  &:not(:last-of-type) {
    margin-bottom: ${multiplier * 3}px;
  }
`

const CloseIcon = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  border-radius: 10px;
  display: flex;
  height: 30px;
  justify-content: center;
  width: 37px;

  svg {
    height: 20px;
    width: 20px;
  }
`

const CloseIconWrapper = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 40px;
  justify-content: center;
  position: absolute;
  right: 22px;
  top: 10px;
  width: 40px;
`

const Confirm = styled(PillButton)`
  margin: 20px 0;
`

const ConfirmationCard = styled(Card)`
  left: 13px;
  opacity: ${p => (p.open ? 1 : 0)};
  padding: 20px 25px;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: absolute;
  text-align: center;
  top: 13px;
  transform: ${p => (p.open ? 'translateY(0)' : 'translateY(100px)')};
  transition: all 250ms cubic-bezier(0.94, 0.01, 0.03, 0.98);
  width: calc(100% - 26px);
`

const CtaWrapper = styled.div`
  margin-top: 5px;
  max-width: 65%;
  width: 340px;
`

const Dot = styled.div`
  background-color: ${colors.gray1};
  border-radius: 50%;
  height: 4px;
  width: 4px;
`

const DotsWrapper = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 40px;
  justify-content: center;
  position: absolute;
  right: 40px;
  top: 20px;
  width: 40px;
`

const Dots = styled.div`
  background-color: ${colors.gray8};
  border-radius: 9px;
  display: flex;
  height: 28px;
  justify-content: space-between;
  padding: 12px 10px;
  width: 40px;
`

const Title = styled(TitleBase)`
  margin-bottom: 15px;
  text-transform: capitalize;
`

// prettier-ignore
const Wrapper = styled.div`
  align-items: flex-start;
  background: ${colors.white}D9;
  border-radius: 20px;
  display: flex;
  height: calc(100% - 20px);
  justify-content: center;
  left: 20px;
  opacity: ${p => (p.open ? 1 : 0)};
  padding: 13px;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: absolute;
  top: 10px;
  transition: opacity 100ms ease;
  width: calc(100% - 40px);
  z-index: 5;

  @media (${devices.largeDesktop}) {
    ${p => p.expanded && `
      height: 100%;
      left: 0;
      top: 0;
      width: 100%;
    `}
  }
`

const KabobMenu = ({
  canShare = false,
  expanded = false,
  feedItem,
  feedItemStatus,
  handleEdit,
  handleHide,
  isManaging,
  itemType,
  type,
}) => {
  const [copyText, setCopyText] = useState('Copy link')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { setShareCpcData, setShowShareCpc } = usePostContext()

  const ref = useRef(null)
  const editRef = useRef(null)
  const hideRef = useRef(null)
  const linkRef = useRef(null)
  const shareRef = useRef(null)
  const kabobRefs = [editRef, hideRef, linkRef, shareRef]

  const hideText = type === 'Post' ? 'remove' : 'hide'

  const copyLink = () => {
    setCopyText('Copied')
    setTimeout(() => setCopyText('Copy Link'), 2000)
    navigator.clipboard.writeText(`${window.location.origin}/newsfeed?feedId=${feedItem.id}`)
  }

  // hides KabobMenu when clicking away from the Cta only if showConfirmation is false. this way you're required to hit cancel on ConfirmationCard...JK
  handleClickOut([ref, ...kabobRefs], () => {
    if (!showConfirmation) setIsMenuOpen(false)
  })

  // hides ConfirmationCard and KabobMenu...JK
  const handleCancel = () => {
    setShowConfirmation(false)
    setIsMenuOpen(false)
  }

  // triggers handleClick function prop and also hides ConfirmationCard + KabobMenu so that they don't remain visible if a user unhides newsfeeditem...JK
  const handleConfirmation = () => {
    handleHide()
    handleCancel()
  }

  return (
    <>
      <DotsWrapper id={uId('kabob-dots-wrapper')} onClick={() => setIsMenuOpen(true)}>
        <Dots>
          <Dot />
          <Dot />
          <Dot />
        </Dots>
      </DotsWrapper>
      <Wrapper expanded={expanded} open={isMenuOpen}>
        <CtaWrapper>
          {handleEdit && <Cta id={uId('edit-cpc-btn')} onClick={handleEdit} ref={editRef} text={`Edit ${type}`} thin />}
          {canShare && (
            <Cta
              onClick={() => {
                setShareCpcData({ linkedFeedItem: itemType === FEED_ITEM_TYPES.SHARED_WAMBI ? feedItem.linkedFeedItem : feedItem })
                setShowShareCpc(true)
              }}
              ref={shareRef}
              text='Share this Wambi'
              thin
            />
          )}
          {isManaging && (feedItemStatus == null || (feedItemStatus && feedItemStatus !== FEED_ITEM_STATUS.HIDDEN)) ? (
            <Cta buttonType='secondary' id={uId('hide-cpc-btn')} onClick={() => setShowConfirmation(true)} ref={hideRef} text='Hide' thin />
          ) : null}
          <Cta buttonType='secondary' onClick={copyLink} ref={linkRef} text={copyText} thin />
          <CloseIconWrapper>
            <CloseIcon>
              <Close color={colors.gray1} />
            </CloseIcon>
          </CloseIconWrapper>
        </CtaWrapper>
        <ConfirmationCard open={showConfirmation} shadow={false}>
          <Title fontSize='18px'>{hideText}</Title>
          <Text noClamp>
            Are you sure you want to {hideText} this {type}?
          </Text>
          <Confirm full id='confirm-hide-cpc-btn' onClick={() => handleConfirmation()} text='Yes' thin />
          <PillButton full id='cancel-hide-cpc-btn' inverted onClick={() => handleCancel()} text='Cancel' thin />
        </ConfirmationCard>
      </Wrapper>
    </>
  )
}

KabobMenu.propTypes = {
  canShare: PropTypes.bool,
  expanded: PropTypes.bool,
  feedItem: PropTypes.object,
  feedItemStatus: PropTypes.number,
  handleEdit: PropTypes.func,
  handleHide: PropTypes.func.isRequired,
  isManaging: PropTypes.bool,
  itemType: PropTypes.number,
  type: PropTypes.oneOf(['Post', 'Shared Wambi', 'Wambi']).isRequired,
}

export default KabobMenu

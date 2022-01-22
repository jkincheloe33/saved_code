import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { colors, shadows } from '@assets'
import { Card, PillButton, Text, Title } from '@components'
import { useResizeContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_STATUS } from '@utils'

const StyledPillBtn = styled(PillButton)`
  margin-bottom: 15px;
`

const ButtonsContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  padding: 20px;
`

const Cancel = styled(Text)`
  cursor: pointer;
`

const ConfirmationContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  height: 100%;
  margin: ${p => (p.openConfirmation ? '20px 0 20px' : '0 0 20px')};
  max-height: ${p => (p.openConfirmation ? `${p.maxHeight + 200}px` : '0')};
  overflow: hidden;
  padding: ${p => (p.openConfirmation ? '20px' : '0')};
  text-align: center;
  transition: max-height 200ms ease;
`

const HideBtn = styled(PillButton)`
  display: ${p => (p.hideBtn ? 'none' : 'block')};
`

const HiddenWambiCard = styled(Card)`
  background-color: ${colors.gray3}4D;
  padding: 15px 25px 25px;
`

const HideText = styled(Text)`
  display: inline-block;
  margin-bottom: 15px;
`

const HideTitle = styled(Title)`
  margin-bottom: 15px;
`

const UndoBtn = styled(PillButton)`
  margin-top: 20px;
`

const Wrapper = styled.div`
  /* This calculates the menu to the right of the CPC details modal...JC */
  left: ${p => (p.windowWidth - p.modalWidth) / 2 + p.modalWidth}px;
  max-width: 400px;
  min-width: 250px;
  opacity: ${p => (p.isOpen ? 1 : 0)};
  padding: 0 20px 20px;
  pointer-events: ${p => (p.isOpen ? 'auto' : 'none')};
  position: absolute;
  right: 30px;
  top: ${p => (p.windowHeight - p.modalHeight) / 2 - 20}px;
  z-index: 6;
`

const BrowseWambiMenu = ({
  feedItem,
  hiddenBtns,
  isOpen,
  modalRef,
  openConfirmation,
  resetConfirmationContainer,
  setHiddenBtns,
  setOpenConfirmation,
}) => {
  const [copyText, setCopyText] = useState('Copy Link')
  const [maxHeight, setMaxHeight] = useState(0)
  const [type, setType] = useState('')
  const [wambiHidden, setWambiHidden] = useState(false)

  const { windowHeight, windowWidth } = useResizeContext()

  const { cpcId, id: feedId, isManaging } = { ...feedItem }

  const ref = useRef()

  useEffect(() => {
    if (!isManaging) setHiddenBtns({ hideWambi: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (ref?.current) setMaxHeight(ref.current.clientHeight)
  }, [type])

  const copyLink = () => {
    setCopyText('Copied')
    setTimeout(() => setCopyText('Copy Link'), 1000)
    navigator.clipboard.writeText(`${window.location.origin}/newsfeed?feedId=${feedId}`)
  }

  const handleHideWambi = async status => {
    const {
      data: { success },
    } = await coreApi.post('/feedItem/update', { cpcId, feedId, status })

    if (success) {
      if (status === FEED_ITEM_STATUS.VISIBLE) {
        setOpenConfirmation(false)
        setHiddenBtns(hideBtn => ({ ...hideBtn, hideWambi: false }))
      }
      setWambiHidden(status === FEED_ITEM_STATUS.HIDDEN)
    }
  }

  return (
    <Wrapper
      isOpen={isOpen}
      modalHeight={modalRef?.current?.offsetHeight}
      modalWidth={modalRef?.current?.offsetWidth}
      windowHeight={windowHeight}
      windowWidth={windowWidth}
    >
      <ConfirmationContainer maxHeight={maxHeight} openConfirmation={openConfirmation} transform='translateY(8%)'>
        <div ref={ref}>
          {type === 'hideWambi' && !wambiHidden ? (
            <>
              <HideTitle fontSize='18px' fontWeight='700'>
                Hide Wambi
              </HideTitle>
              <HideText color='black' noClamp>
                Are you sure you want to hide this Wambi?
              </HideText>
              <StyledPillBtn
                fontWeight='600'
                id='confirm-hide-wambi-btn'
                onClick={() => handleHideWambi(FEED_ITEM_STATUS.HIDDEN)}
                text='Confirm'
              />
              <Cancel color='blurple' onClick={resetConfirmationContainer}>
                No, Cancel
              </Cancel>
            </>
          ) : (
            <HiddenWambiCard backgroundColor='disabled' shadow={false}>
              <Title fontSize='18px'>Wambi hidden</Title>
              <UndoBtn
                buttonType='secondary'
                full
                id='undo-hide-wambi-btn'
                inverted
                onClick={() => handleHideWambi(FEED_ITEM_STATUS.VISIBLE)}
                text='Undo'
                thin
              />
            </HiddenWambiCard>
          )}
        </div>
      </ConfirmationContainer>
      <ButtonsContainer>
        <StyledPillBtn buttonType='secondary' id='review-cpc-copy-link-btn' onClick={copyLink} text={copyText} />
        <HideBtn
          buttonType='secondary'
          fontWeight='600'
          hideBtn={hiddenBtns.hideWambi || wambiHidden}
          id='review-cpc-hide-btn'
          onClick={() => {
            setHiddenBtns({ hideWambi: true })
            setOpenConfirmation(true)
            setType('hideWambi')
          }}
        >
          Hide
        </HideBtn>
      </ButtonsContainer>
    </Wrapper>
  )
}

BrowseWambiMenu.propTypes = {
  feedItem: PropTypes.object,
  hiddenBtns: PropTypes.shape({
    hideWambi: PropTypes.bool,
  }),
  isOpen: PropTypes.bool,
  modalRef: PropTypes.object,
  openConfirmation: PropTypes.bool,
  resetConfirmationContainer: PropTypes.func,
  setHiddenBtns: PropTypes.func,
  setOpenConfirmation: PropTypes.func,
}

export default BrowseWambiMenu

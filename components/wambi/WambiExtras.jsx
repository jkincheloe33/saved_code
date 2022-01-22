import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CalendarIcon2, colors, devices, multiplier, gradients, StarIcon } from '@assets'
import {
  Avatar,
  Card as CardBase,
  Checkbox,
  CtaFooter,
  DynamicContainer,
  Layout,
  Loader,
  Paragraph,
  PillButton,
  PopUp,
  Schedule,
  Tag,
  Text,
  TextArea,
} from '@components'
import { useCelebrationContext, useDraftContext, useRefreshDataContext, useToastContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType } from '@utils'

const CancelBtn = styled(Text)`
  cursor: pointer;
  margin-top: ${multiplier * 3}px;
`

const Card = styled(CardBase)`
  margin-top: 20px;
  padding: 0 22px 22px;
`

const Error = styled(Paragraph)`
  padding-bottom: 20px;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}BF;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  transform: opacity 250ms ease;
  z-index: 3;
`

const ScheduleWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${multiplier * 3}px;
  width: 100%;
`

const ToggleWrapper = styled.div`
  align-items: center;
  display: flex;
  margin-top: 22px;

  ${Paragraph} {
    cursor: pointer;
    flex: 1;
    margin: auto 0 auto 20px;

    @media (${devices.desktop}) {
      flex: none;
    }
  }
`

const StyledTextArea = styled(TextArea)`
  margin-top: 25px;
  min-height: 81px;
`

const ValuesInnerWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const ValuePill = styled(PillButton)`
  margin: 10px 0;
  padding: 3px 0;
  width: 47%;
`

const ValuesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 0;

  ${Text} {
    padding-bottom: 17px;
  }
`

const Wrapper = styled(DynamicContainer)`
  padding: 0 22px 140px;
`

const WambiExtras = ({ cpcData, cpcScreens, cta, handleCancelCpc, saveDraft, scheduledAt, setActive, setCpcData, setScheduledAt }) => {
  const [errorMsg, setErrorMsg] = useState('')
  const [invalidTime, setInvalidTime] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [openScheduleLater, setOpenScheduleLater] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState([])

  const { setCelebration } = useCelebrationContext()
  const { cpcDraftData, getDraftCounts } = useDraftContext()
  const { refreshData } = useRefreshDataContext()
  const { setToastData } = useToastContext()

  const ref = useRef()

  const handleCancel = () => {
    setOpenSchedule(false)
    setScheduledAt(cpcDraftData?.scheduledAt)
    if (invalidTime) setInvalidTime(false)
  }

  // saves your draft and resets states...JK
  const handleConfirm = () => {
    setOpenSchedule(false)
    setOpenScheduleLater(false)
    saveDraft()
    if (invalidTime) setInvalidTime(false)
  }

  const handleDate = date => setScheduledAt(tsa => ({ ...tsa, date }))

  const handleTime = time => {
    setScheduledAt(tsa => ({ ...tsa, time }))
    if (!time) setInvalidTime(true)
    else setInvalidTime(false)
  }

  const handleSubmit = async e => {
    e?.preventDefault()

    if (scheduledAt) saveDraft()
    else {
      setSubmitting(true)

      const {
        data: { completedChallenges, newFeedId, msg, rewardProgress, success },
      } = await coreApi.post('/wambi/postWambi', { cpcData, feedItemDraftId: cpcDraftData?.id })

      if (success) {
        refreshData({ action: 'updateWambis', data: { feedId: newFeedId } })
        getDraftCounts()
        setCelebration({ completeChallenges: completedChallenges, rewardProgress })
        handleCancelCpc()

        setToastData({
          callout: 'Wambi sent!',
          icon: StarIcon,
          id: 'send-wambi-toast',
          spin: true,
        })
      } else {
        setErrorMsg(msg)
        setSubmitting(false)
      }
    }
  }

  // toggles value selection...JK
  const handleValueSelection = value => {
    const selectedValues = cpcData.values
    const exists = selectedValues.includes(value.id)

    if (exists) setCpcData({ ...cpcData, values: selectedValues.filter(v => v !== value.id) })
    else setCpcData({ ...cpcData, values: [...selectedValues, value.id] })
  }

  useEffect(() => {
    // Scrolls the user to the bottom of the page while they type so textarea doesn't go under footer...KA
    if (ref?.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [cpcData.nominate, cpcData.nominateComment])

  useEffect(() => {
    const getClientValues = async () => {
      const {
        data: { success, values },
      } = await coreApi.get('/wambi/getClientValues')

      if (success) setValues(values)
    }

    getClientValues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout cta={cta} dark handleBack={() => setActive(cpcScreens.COMPOSE)} id='cpc-extras' inner noFooter title='Send a Wambi'>
      <Wrapper ref={ref}>
        <Card>
          <ValuesWrapper>
            <Text color='gray1' noClamp>
              Which of these best fits this moment?
            </Text>
            <Text fontSize='14px'>Select one or more*</Text>
            <ValuesInnerWrapper>
              {values.map((value, index) => (
                <ValuePill
                  background={cpcData.values.includes(value.id) ? gradients.blue : ''}
                  buttonType={cpcData.values.includes(value.id) ? 'primary' : 'secondary'}
                  id={`value-${index}-btn`}
                  key={index}
                  onClick={() => handleValueSelection(value)}
                  small
                  text={value.name}
                />
              ))}
            </ValuesInnerWrapper>
          </ValuesWrapper>
        </Card>
        <Card>
          <ToggleWrapper>
            <Checkbox
              checked={cpcData.shareOnNewsfeed}
              id='share-on-newsfeed-checkbox'
              onChange={() => setCpcData(cd => ({ ...cd, shareOnNewsfeed: !cd.shareOnNewsfeed }))}
            />
            <Paragraph onClick={() => setCpcData(cd => ({ ...cd, shareOnNewsfeed: !cd.shareOnNewsfeed }))}>
              Share Wambi on the newsfeed
            </Paragraph>
          </ToggleWrapper>
        </Card>
        {cpcData.recipients.length === 1 && cpcData.type.awardTypeId && (
          <Card>
            <ToggleWrapper>
              <Checkbox
                checked={cpcData.nominate}
                id='nominate-award-checkbox'
                onChange={() => setCpcData(cd => ({ ...cd, nominate: !cd.nominate }))}
                spacing='0 20px 0 0'
              />
              <Avatar image={cpcData.recipients[0].thumbnailImage} ratio='50px' />
              <Paragraph onClick={() => setCpcData(cd => ({ ...cd, nominate: !cd.nominate }))}>
                Nominate {cpcData.recipients[0].name} for the <b>{cpcData.type.awardName} Award</b>
              </Paragraph>
            </ToggleWrapper>
            {cpcData.nominate && (
              <StyledTextArea
                grow
                id='nominate-award-comment'
                name='nominateComment'
                onChange={e => setCpcData(cd => ({ ...cd, nominateComment: e.target.value }))}
                placeholder='Tell us why you are nominating this person (optional, reviewed only by the awards voting committee)...'
                rows={3}
                value={cpcData.nominateComment}
              />
            )}
          </Card>
        )}
      </Wrapper>
      <CtaFooter column>
        {scheduledAt && (
          <Tag
            handleDelete={() => setScheduledAt(null)}
            icon={CalendarIcon2}
            spacing={`0 0 ${multiplier * 2}px`}
            text={`Scheduled for ${moment(scheduledAt.date).format('MMM D')} at ${scheduledAt.time}`}
          />
        )}
        {errorMsg && (
          <Error color='berry' fontWeight='600'>
            {errorMsg}
          </Error>
        )}
        <PillButton
          disabled={!cpcData.values.length || submitting}
          full
          handleIconClick={() => setOpenScheduleLater(true)}
          id='cpc-compose-next-btn'
          onClick={handleSubmit}
          text={scheduledAt ? 'Schedule' : 'Send now'}
          type='submit'
        />
      </CtaFooter>
      <PopUp handleClose={() => setOpenScheduleLater(false)} open={openScheduleLater}>
        <ScheduleWrapper>
          <PillButton full onClick={() => setOpenSchedule(true)} buttonType={'secondary'} text='Schedule for later' />
          <CancelBtn color='blurple' fontSize='18px' onClick={() => setOpenScheduleLater(false)}>
            Cancel
          </CancelBtn>
        </ScheduleWrapper>
      </PopUp>
      <PopUp open={openSchedule}>
        <Schedule
          date={scheduledAt?.date}
          handleCancel={handleCancel}
          handleConfirm={handleConfirm}
          onChange={handleDate}
          setTime={handleTime}
          subText='Wambi will be published at scheduled date/time.'
          time={!invalidTime && scheduledAt?.time}
          title='Schedule for Later'
        />
      </PopUp>
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
    </Layout>
  )
}

WambiExtras.propTypes = {
  ...CpcWorkflowType,
  handleCancelCpc: PropTypes.func.isRequired,
  saveDraft: PropTypes.func,
}

export default WambiExtras

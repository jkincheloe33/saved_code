import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import {
  CalendarIcon2,
  CancelBlackIcon,
  CheckmarkIcon5,
  colors,
  devices,
  EditIcon3,
  gradients,
  MegaphoneIcon,
  multiplier,
  PinIcon,
  shadows,
  VideoIcon,
} from '@assets'
import {
  CtaFooter,
  DynamicContainer,
  FileUpload,
  Image,
  ImageCanvas,
  Input,
  Loader,
  Layout,
  MenuDropdown,
  PillButton,
  PopUp,
  RealmFilter,
  RoundButton,
  Schedule,
  Tag,
  Text,
  TextArea,
} from '@components'
import { useCelebrationContext, useDraftContext, useRefreshDataContext, useToastContext } from '@contexts'
import { api } from '@services'
import { dataURItoBlob, FEED_ITEM_DRAFT_STATUS, PIN_POST_DAYS } from '@utils'

const Button = styled(PillButton)`
  &:not(:first-of-type) {
    margin-top: 20px;
  }
`

const CancelBtn = styled(Text)`
  cursor: pointer;
  margin-top: ${multiplier * 3}px;
`

const ClearFileButton = styled(RoundButton)`
  background-color: ${colors.white};
  border-radius: 50px;
  box-shadow: ${shadows.card};
  margin: 10px;
  position: absolute;
  right: 0%;
  top: 0%;
  z-index: 2;
`

const DiscardBtn = styled.div`
  background-color: ${colors.gray5};
  border-radius: 14px;
  color: ${colors.berry};
  cursor: pointer;
  font-size: 18px;
  margin-top: ${multiplier * 2}px;
  padding: 14px 15px;
  text-align: center;
  width: 100%;
`

const DaysInput = styled(Input)`
  margin-left: 10px;
  width: 25px;

  input {
    font-size: 20px;
    // Hide arrows for number input...CY
    -moz-appearance: textfield;

    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    ::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`
const DaysInputIcon = styled(Image)`
  margin-left: auto;
`

const DaysInputWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  border-radius: 10px;
  display: flex;
  margin-bottom: 16px;
  padding: 5px;
  width: 100%;
`

const ErrorMessage = styled.p`
  background-color: ${colors.berry}26;
  border-radius: 10px;
  color: ${colors.berry};
  font-weight: 500;
  margin-top: 0;
  padding: 20px;
  text-align: center;
`

const FileWrapper = styled.div`
  display: ${p => (p.visible ? 'inline-block' : 'none')};

  padding-bottom: 23px;
  position: relative;
  width: 100%;
`

const FileTypeWrapper = styled.div`
  img {
    cursor: pointer;
  }
`

const IconWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  // needed to sit over top of the RealmFilter...JK
  z-index: 6;
`

const Note = styled(Text)`
  background-color: ${colors.white}99;
  border-radius: 10px;
  padding: 6px 20px;
  text-align: center;
  width: 100%;
`

const OptionsWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
`

const PinDaysWrapper = styled.div`
  width: 100%;
`

const PinIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  padding: ${multiplier}px;
  width: auto;
`

const PinText = styled(Text)`
  margin-bottom: ${multiplier * 2}px;
`

const PinTitle = styled(Text)`
  margin-bottom: ${multiplier}px;
`

const RealmFilterLabel = styled(Text)`
  letter-spacing: 1px;
  margin-bottom: ${multiplier}px;
`

const ScheduleWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${multiplier * 3}px;
  width: 100%;
`

const StyledImage = styled(Image)`
  border-radius: 15px;
  display: ${p => !p.visible && 'none'};
`

const StyledTextArea = styled(TextArea)`
  min-height: 190px;
`

const TagWrapper = styled.div`
  margin-bottom: ${multiplier * 2}px;
`

const TextAreaWrapper = styled.div`
  border-radius: 20px;
  box-shadow: ${shadows.card};
  margin-top: 20px;
  min-height: 285px;
  padding: 22px 20px 0px 20px;
`

const VideoContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  margin-top: ${multiplier * 2}px;
`

const VideoImage = styled(Image)`
  border-radius: 15px;
  height: 40px;
`

const VideoImageWrapper = styled.div`
  align-items: center;
  background-image: ${gradients.grayBlue};
  border-radius: 15px;
  display: ${p => (!p.visible ? 'none' : 'flex')};
  flex-direction: column;
  padding: ${multiplier}px;
  width: 100%;

  @media (${devices.Desktop}) {
    height: 400px;
  }
`

const VideoName = styled(Text)`
  margin: ${multiplier}px 0;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  overflow-x: hidden;
  padding: 30px 20px 200px;
`

const DraftPost = ({
  active,
  editor,
  expanded = false,
  handleBack,
  height,
  imageURL,
  itemType,
  newImage,
  postScreens,
  selectedDraft,
  setActive,
  setImageURL,
  setNewImage,
  setSelectedDraft,
  setVideoUploaded,
  setZoomValue,
  width,
}) => {
  const [content, setContent] = useState('')
  const [date, setDate] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileRemoved, setFileRemoved] = useState(false)
  const [fileSource, setFileSource] = useState(null)
  const [filterGroups, setFilterGroups] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pinDetail, setPinDetail] = useState({
    days: PIN_POST_DAYS.DEFAULT,
    // Toggle check to show pin days input...CY
    isActive: false,
    // Set input red if user input inValid data (eg. -1, 200, etc)...CY
    isValid: true,
    // Check if input was focused...CY
    wasFocused: false,
  })
  const [openPinPost, setOpenPinPost] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [openScheduleDatePopUp, setOpenScheduleDatePopUp] = useState(false)
  const [selectedDraftDetails, setSelectedDraftDetails] = useState(null)
  const [time, setTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { setCelebration } = useCelebrationContext()
  const { getDraftCounts } = useDraftContext()
  const { refreshData } = useRefreshDataContext()
  const { setToastData } = useToastContext()

  const { banner, draftData, id, scheduledAt } = { ...selectedDraftDetails }

  const fileInputRef = useRef(null)
  const daysInputRef = useRef(null)

  let prevDate
  let prevTime

  const reader = new FileReader()

  if (scheduledAt) {
    prevDate = moment(scheduledAt).format('MMMM DD, YYYY')
    prevTime = moment(scheduledAt).format('h:mm A')
  }

  // Disables post button if there is not enough valid content...PS
  const disabled = ((fileSource || imageURL) == null && !content) || !filterGroups.length || (pinDetail.isActive && !pinDetail.days)
  // Disables pin submit button if there is no date...PS
  const disabledPinBtn = !pinDetail.days
  // Disables close pop up confirmation if the existing content matches the edited content or there is no content...JK
  const disabledPopUp =
    // disable when no content has been updated...PS
    (draftData?.content === content &&
      // disabled when no media has been updated...PS
      banner === fileSource &&
      // disabled when groups has not been updated...PS
      draftData?.groups.length === filterGroups?.length &&
      draftData?.groups.every(sg => filterGroups?.find(fg => fg.id === sg.id)) &&
      // disabled when there is no pin || pin has not been updated...PS
      (draftData?.pinDays == pinDetail.days || (!pinDetail.isActive && !draftData?.pinDays && pinDetail.days != 0)) &&
      // disabled when date or time has not been updated...PS
      date == prevDate &&
      time == prevTime) ||
    (fileSource == null && !content)

  const clearFile = () => {
    setFileSource(null)
    setFileRemoved(true)
    setErrorMessage('')
    setImageURL(null)
    setZoomValue(1.2)
  }

  const closeDraftPost = () => {
    if (disabledPopUp) {
      handleBack()
      setSelectedDraft(null)
    } else setIsMenuOpen(true)
  }

  const createFormData = () => {
    const formData = new FormData()
    formData.append('groups', JSON.stringify(filterGroups))
    // formData.append('traits', JSON.stringify(selectedTraits))
    formData.append('content', content)
    if (selectedDraft) {
      formData.append('feedItemDraftId', id)
      formData.append('draftDetails', JSON.stringify(selectedDraftDetails))
    }
    if (pinDetail.isActive) formData.append('pinDays', pinDetail.days)
    if (fileSource?.src) {
      if (fileSource.type.includes('image') && fileSource.type !== 'image/gif')
        formData.append('file', dataURItoBlob(editor.getImageScaledToCanvas().toDataURL(fileSource.src)), fileSource.name)
      else formData.append('file', dataURItoBlob(fileSource.src), fileSource.name)
    } else if (fileRemoved) {
      formData.append('fileRemoved', true)
    }
    return formData
  }

  const handleCancel = () => {
    // set prev date and time, and close schedule popup...PS
    setDate(prevDate)
    setTime(prevTime)
    setOpenScheduleDatePopUp(false)
  }

  const handleConfirm = ({ scheduleSaved }) => {
    handleBack()
    saveDraft({ scheduleSaved })
  }

  const handleDeleteTag = () => {
    setDate(null)
    setTime(null)
  }

  const handleDraftCount = () => setTimeout(getDraftCounts, 800)

  const fileRender = () => {
    return (
      <FileWrapper visible={fileSource || imageURL ? true : false}>
        <ClearFileButton onClick={clearFile} ratio='29px' image={{ alt: 'cancel file', src: CancelBlackIcon }} />
        <VideoImageWrapper visible={fileSource?.type?.includes('video') ?? undefined}>
          <VideoContent>
            <VideoImage alt='video icon' src={VideoIcon} width='59px' />
            <VideoName color='blue' fontSize='14px' fontWeight='600' noClamp>
              {fileSource?.name} selected
            </VideoName>
          </VideoContent>
          <Note color='blue' fontSize='14px' fontWeight='700' noClamp>
            Video must be 2 minutes or less
          </Note>
        </VideoImageWrapper>
        {imageURL ? (
          <ImageCanvas border={0} height={height} imageURL={imageURL} width={width} />
        ) : (
          <StyledImage
            visible={fileSource?.type ? fileSource.type.includes('image') : banner}
            src={fileSource?.src ? fileSource.src : fileSource}
          />
        )}
      </FileWrapper>
    )
  }

  const openImageEditor = e => {
    setNewImage(e.target.files[0])
    setActive(postScreens.IMAGE_EDITOR)
  }

  const onFileChange = e => {
    setErrorMessage('')

    if (e.target.files[0].type.includes('image') && e.target.files[0].type !== 'image/gif') openImageEditor(e)
    else {
      reader.readAsDataURL(e.target.files[0])
      reader.onload = () => {
        setFileSource({
          name: e.target.files[0].name,
          src: reader.result,
          type: e.target.files[0].type,
        })
      }
    }
  }

  const showDraftToast = () => {
    setToastData({
      callout: selectedDraft ? 'Draft updated!' : 'Draft saved!',
      details: 'You can finish this post later.',
      gradient: {
        colors: [
          {
            color: 'mint',
            location: '30%',
          },
          {
            color: 'skyBlue',
            location: '100%',
          },
        ],
        position: 'to bottom',
      },
      icon: CheckmarkIcon5,
      id: 'draft-saved-toast',
    })
  }

  const showPostToast = () => {
    setToastData({
      callout: 'Posted!',
      details: 'Your post has been added to the newsfeed.',
      icon: MegaphoneIcon,
      id: 'post-posted-toast',
      spin: true,
    })
  }

  const showScheduleToast = () => {
    setToastData({
      callout: 'Post scheduled!',
      // eslint-disable-next-line quotes
      details: "We'll take it from here.",
      gradient: {
        colors: [
          {
            color: 'mint',
            location: '30%',
          },
          {
            color: 'skyBlue',
            location: '100%',
          },
        ],
        position: 'to bottom',
      },
      icon: CheckmarkIcon5,
      id: 'scheduled-draft-saved-toast',
    })
  }

  const submitPost = async () => {
    setSubmitting(true)
    const formData = createFormData()

    if (fileSource?.type?.includes('video')) return await submitVideoPost(formData)

    const {
      data: { completedChallenges, newFeedId, rewardProgress, success, msg },
    } = await api.post('newsfeed/announcements/postAnnouncement', formData)

    if (success) {
      refreshData({ data: { feedId: newFeedId } })
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
      if (selectedDraft) handleDraftCount()
      handleBack()
      showPostToast()
    } else {
      setErrorMessage(msg)
    }
    setSubmitting(false)
  }

  const submitVideoPost = async formData => {
    setSubmitting(true)

    const {
      data: { success, msg },
    } = await api.post('newsfeed/announcements/postVideoAnnouncement', formData)

    if (success) {
      setVideoUploaded(true)
      if (selectedDraft) handleDraftCount()
      setActive(postScreens.UPLOAD_VIDEO)
      showPostToast()
    } else setErrorMessage(msg)

    setSubmitting(false)
  }

  const saveDraft = async ({ scheduleSaved }) => {
    setSubmitting(true)
    setIsMenuOpen(false)

    let dateObj

    // format date when user is updating a draft...PS
    if (selectedDraft) {
      dateObj = date && new Date(date)
    }
    // format time when user is scheduling a date...PS
    const newTime = moment(time, ['h A']).format('H')
    const scheduled = dateObj ? dateObj.setHours(newTime, 0, 0) : date && date.setHours(newTime, 0, 0)

    const formData = createFormData()
    if (selectedDraft) {
      formData.append('feedItemDraftId', id)
      formData.append('draftDetails', JSON.stringify(selectedDraftDetails))
    }

    if (scheduled) formData.append('scheduledAt', new Date(scheduled))

    // Only valid scheduled posts can be set to ready status...JC
    const isReady = Boolean((content || fileSource) && scheduled)
    const status = isReady ? FEED_ITEM_DRAFT_STATUS.READY : FEED_ITEM_DRAFT_STATUS.NOT_READY
    formData.append('status', status)

    const isVideo = fileSource?.type?.includes('video')

    const {
      data: { success, msg },
    } = await api.post(
      selectedDraft ? `feedItemDraft/post/update?isVideo=${isVideo}` : `feedItemDraft/post/create?isVideo=${isVideo}`,
      formData
    )

    if (success) {
      handleDraftCount()
      handleBack()
      if (scheduleSaved) showScheduleToast()
      else showDraftToast()
    } else setErrorMessage(msg)
    // used to prevent the user from submitting more than once...PS
    setTimeout(() => setSubmitting(false), 800)
    setSelectedDraft(null)
  }

  useEffect(() => {
    // if coming from a draft list,get the draft detail...PS
    if (selectedDraft?.id) {
      const getDraftPostDetails = async () => {
        setSubmitting(true)

        const {
          data: { success, draftDetails },
        } = await api.post('feedItemDraft/post/single', {
          feedItemDraftId: selectedDraft.id,
          groups: selectedDraft.groups,
          itemType,
        })

        if (success) {
          // set image, pinned day on load and update content...PS
          const { banner, draftData } = { ...draftDetails }
          // Remove scheduledAt time if user opened a failed draft...JC
          if (selectedDraft.failedDraft) draftDetails.scheduledAt = null
          setSelectedDraftDetails(draftDetails)
          if (banner) setFileSource(banner)
          if (draftData?.content) setContent(draftData.content)
          if (draftData?.pinDays) {
            setPinDetail({
              days: draftData.pinDays,
              isActive: true,
              isValid: true,
            })
          }
        }
        setSubmitting(false)
      }
      getDraftPostDetails()
    }
  }, [itemType, selectedDraft])

  useEffect(() => {
    // if coming from a draft list set initial state for filterGroups...PS
    if (selectedDraft) setFilterGroups(draftData?.groups)
    // if there is a scheduled time, set the state for date and time...PS
    if (scheduledAt) {
      setDate(prevDate)
      setTime(prevTime)
    }
  }, [draftData, prevDate, prevTime, selectedDraft, scheduledAt])

  useEffect(() => {
    if (imageURL) {
      const newFile = new File([imageURL], newImage.name, { type: newImage.type })
      reader.readAsDataURL(newFile)
      reader.onload = () => {
        setFileSource({
          name: newFile.name,
          src: reader.result,
          type: newFile.type,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageURL])

  useEffect(() => {
    if (newImage && active === postScreens.DRAFT_POST) {
      fileInputRef.current.value = null
    }
  }, [active, newImage, postScreens.DRAFT_POST])

  return (
    <>
      <Layout
        cta={{ onClick: () => closeDraftPost(), text: 'Close' }}
        handleBack={closeDraftPost}
        id='draft-post'
        inner
        noFooter
        title='Create a Post'
      >
        <Wrapper>
          <RealmFilterLabel fontSize='14px'>VISIBLE TO: </RealmFilterLabel>
          <RealmFilter filterGroups={filterGroups} savedGroups={draftData?.groups} setFilterGroups={setFilterGroups} />
          <TextAreaWrapper>
            {fileRender()}
            {errorMessage && <ErrorMessage color='berry'>{errorMessage}</ErrorMessage>}
            <StyledTextArea
              id='message-input'
              onChange={e => setContent(e.target.value)}
              placeholder='Write your post...'
              value={content}
            />
            <IconWrapper>
              {pinDetail.isActive ? (
                <Tag
                  alt='purple pin icon'
                  color={colors.blurple}
                  handleDelete={() => setPinDetail(p => ({ ...p, isActive: !p.isActive, days: 0 }))}
                  icon={PinIcon}
                  imageWidth={'18px'}
                  text={`${pinDetail.days} days`}
                />
              ) : (
                <PinIconWrapper onClick={() => setOpenPinPost(true)}>
                  <Image alt='file upload icon' src={PinIcon} width='24' />
                </PinIconWrapper>
              )}
              <FileTypeWrapper>
                <FileUpload id={'edit-file-input'} onFileChange={onFileChange} ref={fileInputRef} />
              </FileTypeWrapper>
            </IconWrapper>
          </TextAreaWrapper>
        </Wrapper>
        <CtaFooter column>
          {date && time && (
            <TagWrapper>
              <Tag
                alt='calendar icon'
                color={colors.blurple}
                handleDelete={handleDeleteTag}
                icon={CalendarIcon2}
                imageWidth={'18px'}
                text={`Scheduled on ${moment(scheduledAt).format('MMM DD')} at ${moment(scheduledAt).format('hA')}`}
              />
            </TagWrapper>
          )}
          <PillButton
            disabled={submitting || disabled}
            full
            handleIconClick={() => setOpenSchedule(true)}
            id='post-btn'
            onClick={date && time ? saveDraft : submitPost}
            text={date && time ? 'Schedule' : 'Post now'}
            thin
          />
        </CtaFooter>
      </Layout>
      <MenuDropdown expanded={expanded} open={isMenuOpen} setIsMenuOpen={setIsMenuOpen}>
        <Button id='save-draft' onClick={() => saveDraft({ savedDraft: false })} text='Save draft' thin />
        <Button buttonType={'secondary'} id='keep-editing-draft' onClick={() => setIsMenuOpen(false)} text='Keep editing' thin />
        <DiscardBtn
          id='discard-draft'
          onClick={() => {
            handleBack()
            setTimeout(() => setSelectedDraft(null), 500)
          }}
        >
          {selectedDraft ? ' Discard changes' : 'Discard draft'}
        </DiscardBtn>
      </MenuDropdown>

      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>

      <PopUp handleClose={() => setOpenPinPost(false)} open={openPinPost}>
        <OptionsWrapper>
          <PinTitle color='gray1' fontSize='20px'>
            Pin on the Newsfeed
          </PinTitle>
          <PinText color='gray1'>Pin to the top of the newsfeed up to 30 days</PinText>

          <PinDaysWrapper id='pin-post-day-wrapper'>
            <DaysInputWrapper onClick={() => daysInputRef?.current?.focus()}>
              <DaysInput
                color={!pinDetail.isValid ? 'berry' : null}
                id='pin-post-day-input'
                label='pinDays'
                max={PIN_POST_DAYS.MAX}
                min={PIN_POST_DAYS.MIN}
                onChange={event => {
                  const value = event.target.value
                  //Update pinDays when value updates
                  if (value.length) {
                    if (value > PIN_POST_DAYS.MAX) setPinDetail(p => ({ ...p, days: PIN_POST_DAYS.MAX, isValid: false }))
                    else if (value < PIN_POST_DAYS.MIN) setPinDetail(p => ({ ...p, days: PIN_POST_DAYS.MIN, isValid: false }))
                    else setPinDetail(p => ({ ...p, days: value, isValid: true }))
                  }
                  //Let user clear the pin days input...CY
                  else setPinDetail(p => ({ ...p, days: '', isValid: true }))
                }}
                onFocus={() => {
                  //Make sure that input is cleared on the first focus...CY
                  if (!pinDetail.wasFocused) setPinDetail(p => ({ ...p, days: '', wasFocused: true }))
                }}
                ref={daysInputRef}
                type='number'
                value={pinDetail.days}
              />
              <Text color='gray1'>days</Text>
              <DaysInputIcon src={EditIcon3} />
            </DaysInputWrapper>
            <PillButton
              disabled={disabledPinBtn}
              full
              id='pin-post-btn'
              onClick={() => {
                setPinDetail(p => ({ ...p, isActive: !p.isActive }))
                setOpenPinPost(false)
              }}
              text='Done'
            />
          </PinDaysWrapper>
        </OptionsWrapper>
      </PopUp>

      <PopUp handleClose={() => setOpenSchedule(false)} open={openSchedule}>
        <ScheduleWrapper>
          <PillButton full onClick={() => setOpenScheduleDatePopUp(true)} buttonType={'secondary'} text='Schedule for later' />
          <CancelBtn color='blurple' fontSize='18px' onClick={() => setOpenSchedule(false)}>
            Cancel
          </CancelBtn>
        </ScheduleWrapper>
      </PopUp>

      <PopUp open={openScheduleDatePopUp}>
        <Schedule
          date={date ?? prevDate}
          handleCancel={handleCancel}
          handleConfirm={handleConfirm}
          onChange={setDate}
          setTime={setTime}
          submitting={submitting}
          time={time ?? prevTime}
          title={'Schedule for later'}
          subText={'Post will be published at scheduled date/time.'}
        />
      </PopUp>
    </>
  )
}

DraftPost.propTypes = {
  active: PropTypes.number,
  editor: PropTypes.object,
  expanded: PropTypes.bool,
  handleBack: PropTypes.func.isRequired,
  height: PropTypes.number,
  imageURL: PropTypes.string,
  itemType: PropTypes.number,
  newImage: PropTypes.object,
  postScreens: PropTypes.object,
  selectedDraft: PropTypes.object,
  setActive: PropTypes.func,
  setImageURL: PropTypes.func,
  setNewImage: PropTypes.func,
  setProfileToEdit: PropTypes.func,
  setSelectedDraft: PropTypes.func,
  setVideoUploaded: PropTypes.func,
  setZoomValue: PropTypes.func,
  width: PropTypes.number,
}

export default DraftPost

import { useEffect, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CheckmarkIcon5, colors, multiplier } from '@assets'
import {
  DraftsList,
  GroupRecipients,
  ImageSearch,
  ImageTheme,
  Loader,
  MenuDropdown,
  PillButton,
  SearchPeople,
  WambiCompose,
  WambiExtras,
} from '@components'
import { useDraftContext, usePostContext, useToastContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_DRAFT_STATUS, FEED_ITEM_TYPES } from '@utils'

const cpcScreens = {
  DRAFTS: 1,
  IMAGES: 2,
  THEME_DETAILS: 3,
  COMPOSE: 4,
  SEARCH: 5,
  GROUP_RECIPIENTS: 6,
  EXTRAS: 7,
}

const Button = styled(PillButton)`
  &:not(:first-of-type) {
    margin-top: 20px;
  }
`

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
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

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}BF;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.visible ? 1 : 0)};
  pointer-events: ${p => (p.visible ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  transform: opacity 250ms ease;
  z-index: 3;
`

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  position: relative;
`

const initialState = {
  content: '',
  excludedRecipients: [],
  groups: [],
  media: null,
  nominate: false,
  nominateComment: '',
  recipients: [],
  shareOnNewsfeed: true,
  type: null,
  values: [],
}

const WambiWorkflow = ({ handleBack, selectedProfile }) => {
  const {
    cpcDraftCount,
    cpcDraftData,
    getDraftCounts,
    setCpcDraftData,
    setShowDraftsList,
    setWambiDraftId,
    showDraftsList,
    wambiDraftId,
  } = useDraftContext()
  const {
    selectedCpcTheme,
    selectedCpcType,
    setAutoFocusSearch,
    setSelectedCpcTheme,
    setSelectedCpcType,
    setSelectedRecipient,
    setSkipCpcSearch,
    showSendCpc,
    skipCpcSearch,
  } = usePostContext()
  const { setToastData } = useToastContext()

  // showDraftsList will be true if user clicks on their drafts via desktop widget. wambiDraftId will only ever be truthy if user comes in via query params...JK
  const [active, setActive] = useState(showDraftsList || wambiDraftId ? cpcScreens.DRAFTS : cpcScreens.IMAGES)
  const [cpcData, setCpcData] = useState(initialState)
  // the current group that's being edited...JK
  const [groupSelected, setGroupSelected] = useState(null)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const [scheduledAt, setScheduledAt] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  // checks if the draft data does not match the cpcData...JK
  const draftDataUpdated = cpcDraftData && JSON.stringify(cpcDraftData.draftData) !== JSON.stringify(cpcData)
  // checks if the draft scheduledAt does not match scheduledAt...JK
  const draftScheduledAtUpdated = cpcDraftData?.scheduledAt && JSON.stringify(cpcDraftData.scheduledAt) !== JSON.stringify(scheduledAt)
  // checks if one of these cpcData properties is truthy, you should open the confirmation menu...JK
  const cpcDataUpdated = cpcData.content || cpcData.recipients?.length || cpcData.groups?.length

  const deleteGroup = ({ id, isRealm }) => {
    // removes group from cpcData.groups array...PS & JK
    setCpcData(cpcData => ({ ...cpcData, groups: cpcData.groups.filter(g => !(g.id === id && g.isRealm === isRealm)) }))
    setActive(cpcScreens.SEARCH)
  }

  const getPeopleInGroups = (group, func) => {
    // check if group id and isRealm already exists in cpcData.groups...JK
    const exists = cpcData.groups?.some(g => g.id === group.id && g.isRealm === group.isRealm)
    setGroupSelected(group)
    if (!exists) setCpcData(cpcData => ({ ...cpcData, groups: [...cpcData.groups, group] }))

    if (func) {
      func()
      return setActive(cpcScreens.GROUP_RECIPIENTS)
    }

    setActive(cpcScreens.IMAGES)
  }

  const handleClear = () => {
    setSearchInput('')
    setSearchList(null)
  }

  const handleCancel = () => {
    handleClear()
    setAutoFocusSearch(false)
    setSelectedCpcTheme(null)
    setSelectedCpcType(null)
    setSelectedRecipient(null)
    setSkipCpcSearch(false)
    handleBack()

    setTimeout(() => {
      setActive(cpcScreens.IMAGES)
      setShowDraftsList(false)
    }, 500)
  }

  const handleCancelCpc = () => {
    // reset state to default values...JK
    setCpcData(initialState)
    setScheduledAt(null)
    handleCancel()
    setTimeout(() => setCpcDraftData(null), 500)
  }

  const handleConfirm = () => {
    // if editing a draft but made no changes, close the workflow...JK
    if (cpcDraftData && !draftDataUpdated && !draftScheduledAtUpdated) handleCancelCpc()
    // added/made changes that enable the ability to save/update a draft...JK
    else if (cpcDataUpdated || draftDataUpdated || draftScheduledAtUpdated) setShowMenu(true)
    // if you get here, that means there's no need to create a draft, so just close the workflow...JK
    else handleCancelCpc()
  }

  // query db for validated/clean draft data...JK
  const handleSelectedDraft = async ({ failedDraft, id }) => {
    setLoadingDraft(true)

    // Reset wambiDraftId so it won't open the draft when creating wambi...CY
    if (wambiDraftId) setWambiDraftId(null)

    const {
      data: { success, draftDetails, invalidRecipients, invalidType },
    } = await coreApi.post('feedItemDraft/wambi/single', { feedItemDraftId: id })

    if (success) {
      // scheduledAt comes back as a string, so we need to parse it & format so we can update time & date individually...JK
      // Remove scheduledAt time if user opened a failed draft...JC
      const schedule = failedDraft
        ? null
        : draftDetails.scheduledAt && {
            date: new Date(draftDetails.scheduledAt),
            time: moment(draftDetails.scheduledAt).format('h:mm A'),
          }

      // save snap shot of current draft state in order to compare changes and update the draft in the db if needed...JK
      setCpcDraftData({ ...draftDetails, invalidRecipients, invalidType, scheduledAt: schedule })

      // this will pump any saved draftData into the workflow and pre-populate the appropriate components...JK
      setCpcData(draftDetails.draftData)
      if (schedule) setScheduledAt(schedule)

      // showDraftsList will currently be true in order to prevent ImageSearch and SearchPeople from prematurely fetching data. so we need to set it to false to render those components...JK
      setShowDraftsList(false)
      setLoadingDraft(false)
      setActive(cpcScreens.COMPOSE)
    }
  }

  // saves a snapshot of cpcData as a draft or updates an existing draft then closes workflow as usual...JK
  const saveDraft = async () => {
    setSaving(true)
    handleCancelCpc()

    const { content, groups, recipients, type, values } = cpcData
    const { date, time } = { ...scheduledAt }

    // check to make sure cpc has all required data for auto posting a scheduled draft...JK
    const isReady = content && type && values && scheduledAt && (groups.length || recipients.length)
    // convert time to usable format...PS
    const newTime = moment(time, ['h A']).format('H')
    // format scheduled at if date & time properties exist...JK
    const scheduled = date && time && date.setHours(newTime, 0, 0)

    // if cpcDraftData is truthy, that means you are editing an existing draft and need to hit the update endpoint...JK
    const update = !!cpcDraftData

    const {
      data: { success },
    } = await coreApi.post(update ? 'feedItemDraft/wambi/update' : 'feedItemDraft/wambi/create', {
      cpcData,
      feedItemDraftId: cpcDraftData?.id,
      scheduledAt: new Date(scheduled),
      status: isReady ? FEED_ITEM_DRAFT_STATUS.READY : FEED_ITEM_DRAFT_STATUS.NOT_READY,
    })

    if (success) {
      setTimeout(getDraftCounts, 400)
      setToastData({
        callout: scheduled ? 'Wambi scheduled!' : update ? 'Draft updated!' : 'Draft saved!',
        // prettier-ignore
        details: scheduled ? 'We\'ll take it from here' : 'You can finish this Wambi later.',
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
  }

  const toggleFromExclusionList = id => {
    // toggle id in excludedRecipients...PS & JK
    const exists = cpcData.excludedRecipients?.some(er => er === id)
    setCpcData(cpcData => ({
      ...cpcData,
      excludedRecipients: exists ? cpcData.excludedRecipients?.filter(e => e !== id) : [...cpcData.excludedRecipients, id],
    }))
  }

  // Open draft details from url...CY
  // Set to failed draft since only way a user has this query param is through failed draft email link (no bookmarking non-failed now)...JC
  useEffect(() => {
    if (wambiDraftId) handleSelectedDraft({ failedDraft: true, id: wambiDraftId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wambiDraftId])

  useEffect(() => {
    if (selectedCpcType) {
      // Strange fix to trigger actionable insight...CY
      setTimeout(() => {
        setCpcData(cd => ({ ...cd, type: selectedCpcType }))
        setSelectedCpcType(null)
        setActive(cpcScreens.COMPOSE)
      })
    } else if (selectedCpcTheme) setActive(cpcScreens.THEME_DETAILS)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCpcTheme, selectedCpcType])

  useEffect(() => {
    // if user comes from main nav search, or search page. This will supply recipients for the Compose screen...PS
    if (skipCpcSearch) {
      if (selectedProfile?.type === 'group') getPeopleInGroups(selectedProfile)
      else setCpcData(cpcData => ({ ...cpcData, recipients: [selectedProfile] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfile, skipCpcSearch])

  useEffect(() => {
    if (cpcData.groups?.length === 0) setRecipientCount(0)
  }, [cpcData.groups])

  useEffect(() => {
    const getRecipientCount = async () => {
      const {
        data: { groupRecipientCount, success },
      } = await coreApi.post('/wambi/groups/getRecipientCount', {
        excludedRecipients: cpcData.excludedRecipients,
        groups: cpcData.groups,
        recipients: cpcData.recipients,
      })

      if (success) setRecipientCount(groupRecipientCount)
    }

    if (active === cpcScreens.COMPOSE || active === cpcScreens.SEARCH) getRecipientCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const cpcComposeData = {
    recipientCount,
  }

  const cpcExtrasData = {
    handleCancelCpc,
    saveDraft,
  }

  const draftsListData = {
    handleSelectedDraft,
    itemType: FEED_ITEM_TYPES.CPC,
  }

  const imageCategoryData = {
    handleBack: () => {
      setActive(cpcScreens.IMAGES)
      setTimeout(() => setSelectedCpcTheme(null), 500)
    },
  }

  const searchPeopleData = {
    getPeopleInGroups,
    handleBack: () => setActive(cpcScreens.COMPOSE),
    handleClear,
    recipientCount,
    searchInput,
    searchList,
    setSearchInput,
    setSearchList,
    setGroupSelected,
  }

  const groupRecipientsData = {
    deleteGroup,
    groupSelected,
    setGroupSelected,
    toggleFromExclusionList,
  }

  const components = [
    {
      Component: DraftsList,
      data: draftsListData,
    },
    {
      // these checks will prevent the endpoints from running...JK
      Component: !showDraftsList && showSendCpc && ImageSearch,
      data: {
        leftCta: !cpcDataUpdated &&
          cpcDraftCount > 0 && {
            onClick: () => setActive(cpcScreens.DRAFTS),
            text: `Drafts (${cpcDraftCount})`,
          },
      },
    },
    {
      Component: selectedCpcTheme && ImageTheme,
      data: imageCategoryData,
    },
    {
      Component: WambiCompose,
      data: cpcComposeData,
    },
    {
      // these checks will prevent the endpoints from running...JK
      Component: !showDraftsList && showSendCpc && SearchPeople,
      data: searchPeopleData,
    },
    {
      Component: groupSelected && GroupRecipients,
      data: groupRecipientsData,
    },
    {
      Component: cpcData.type && WambiExtras,
      data: cpcExtrasData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cpcData={cpcData}
              cpcScreens={cpcScreens}
              cta={{
                onClick: handleConfirm,
                text: 'Close',
              }}
              scheduledAt={scheduledAt}
              setActive={setActive}
              setCpcData={setCpcData}
              setScheduledAt={setScheduledAt}
            />
          )}
        </Container>
      ))}
      <MenuDropdown open={showMenu} setIsMenuOpen={setShowMenu}>
        <Button disabled={saving} id='save-wambi-draft' onClick={saveDraft} text={cpcDraftData ? 'Save changes' : 'Save draft'} thin />
        <Button buttonType='secondary' id='keep-editing-wambi-draft' onClick={() => setShowMenu(false)} text='Keep editing' thin />
        <DiscardBtn id='discard-wambi-draft' onClick={handleCancelCpc}>
          {cpcDraftData ? 'Discard changes' : 'Discard draft'}
        </DiscardBtn>
      </MenuDropdown>
      <LoaderWrapper visible={loadingDraft}>
        <Loader />
      </LoaderWrapper>
    </Wrapper>
  )
}

WambiWorkflow.propTypes = {
  handleBack: PropTypes.func,
  selectedProfile: PropTypes.object,
}

export default WambiWorkflow

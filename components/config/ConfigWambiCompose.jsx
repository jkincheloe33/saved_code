import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, StarIcon } from '@assets'
import { Checkbox, Image, Paragraph, PillButton, Select, Text, TextArea } from '@components'
import { useToastContext } from '@contexts'
import { coreApi } from '@services'

const Header = styled(Text)`
  margin-bottom: 20px;
`

const ImageWrapper = styled.div`
  margin-bottom: 20px;
  width: 332px;
`

const StyledSelect = styled(Select)`
  margin-bottom: 20px;
`

const StyledTextArea = styled(TextArea)`
  border-radius: 20px;
  margin-bottom: 20px;
  padding: 20px;
`

const SubmitWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
`

const ToggleWrapper = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 22px;
  ${Paragraph} {
    cursor: pointer;
    flex: 1;
    margin: auto 0 auto 20px;
  }
`

const Wrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  min-height: 100%;
  padding: 50px;
`

const ConfigWambiCompose = ({ isSendWambiModalOpen, sentAsPeopleId, setIsSendWambiModalOpen }) => {
  const { setToastData } = useToastContext()

  const [recipientCount, setRecipientCount] = useState(0)
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [wambiData, setWambiData] = useState({
    content: '',
    recipients: '',
    shareOnNewsfeed: true,
    type: null,
    values: [],
  })
  const [wambiThemes, setWambiThemes] = useState([])
  const [wambiTypes, setWambiTypes] = useState([])

  const formatRecipients = () => wambiData.recipients.split(/\r\n|\n|\r|\s|[,]/).filter(r => r.trim() !== '')

  useEffect(() => {
    wambiData.recipients ? setRecipientCount(formatRecipients().length) : setRecipientCount(0)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wambiData.recipients])

  useEffect(() => {
    const getThemes = async () => {
      const {
        data: { success, themes },
      } = await coreApi.get('/config/wambiThemes/list')

      if (success) setWambiThemes(themes.filter(t => t.typesCount > 0))
    }

    if (isSendWambiModalOpen) getThemes()
  }, [isSendWambiModalOpen])

  useEffect(() => {
    const getTypesByTheme = async () => {
      const {
        data: { cpcTypes, success },
      } = await coreApi.post('/config/wambiTypes/list', { cpcThemeId: selectedThemeId, showActiveOnly: true })

      if (success) setWambiTypes(cpcTypes)
    }

    if (selectedThemeId) {
      setWambiData(data => ({ ...data, type: null }))
      getTypesByTheme()
    }
  }, [selectedThemeId])

  const handleSendWambi = async e => {
    e?.preventDefault()

    const {
      data: { msg, success },
    } = await coreApi.post('/wambi/postWambi', {
      cpcData: { ...wambiData, recipients: formatRecipients() },
      sentAsPeopleId,
    })

    if (success) {
      setToastData({
        callout: 'Sent!',
        icon: StarIcon,
        id: 'gift-sent-toast',
        spin: true,
      })
      setIsSendWambiModalOpen(false)
    } else {
      alert(msg)
    }
  }

  return (
    <Wrapper>
      <Header color='coolGray' fontSize='24px'>
        Compose your Wambi here!
      </Header>
      <span style={{ alignSelf: 'flex-start' }}>
        <strong>Recipients: {recipientCount}</strong>
      </span>
      <StyledTextArea
        id='recipients-textarea'
        name='recipients'
        onChange={e => setWambiData(wd => ({ ...wd, recipients: e.target.value }))}
        placeholder='Paste list of recipient hrIds here...'
        rows={5}
        shadow
        value={wambiData.recipients}
      />
      <StyledTextArea
        id='content-textarea'
        name='content'
        onChange={e => setWambiData(wd => ({ ...wd, content: e.target.value }))}
        placeholder='Write your message...'
        rows={5}
        shadow
        value={wambiData.content}
      />
      <StyledSelect
        onChange={e => setSelectedThemeId(e.target.value)}
        options={wambiThemes.map(wt => ({ name: wt.name, value: wt.id }))}
        title='Select a Wambi theme'
        value={selectedThemeId || ''}
      />
      {selectedThemeId && (
        <StyledSelect
          onChange={e => setWambiData(wd => ({ ...wd, type: wambiTypes.find(wt => wt.id === Number(e.target.value)) }))}
          options={wambiTypes.map(wt => ({ name: wt.name, value: wt.id }))}
          title='Select a Wambi type'
          value={wambiData.type?.id || ''}
        />
      )}
      {wambiData.type?.src && (
        <ImageWrapper>
          <Image alt='Wambi image' src={wambiData.type.src} />
        </ImageWrapper>
      )}
      <ToggleWrapper>
        <Checkbox
          checked={wambiData.shareOnNewsfeed}
          id='share-on-newsfeed-checkbox'
          onChange={() => setWambiData(wd => ({ ...wd, shareOnNewsfeed: !wd.shareOnNewsfeed }))}
        />
        <Paragraph onClick={() => setWambiData(wd => ({ ...wd, shareOnNewsfeed: !wd.shareOnNewsfeed }))}>
          Share Wambi on the newsfeed
        </Paragraph>
      </ToggleWrapper>
      <SubmitWrapper>
        <PillButton disabled={!wambiData.recipients || !wambiData.type || !wambiData.content} onClick={handleSendWambi} text='Send' thin />
      </SubmitWrapper>
    </Wrapper>
  )
}

ConfigWambiCompose.propTypes = {
  isSendWambiModalOpen: PropTypes.bool,
  sentAsPeopleId: PropTypes.number,
  setIsSendWambiModalOpen: PropTypes.func,
}

export default ConfigWambiCompose

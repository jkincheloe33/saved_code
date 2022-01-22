import { useEffect, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'

import { colors, multiplier } from '@assets'
import { Card, Checkbox, Input, Schedule, Select, TextArea } from '@components'
import { api } from '@services'
import { SYSTEM_MESSAGE_TYPE_NAMES, systemSettingsSchema } from '@utils'

const Dropdown = styled(Select)`
  margin-top: 8px;
  max-width: 250px;
  padding: ${multiplier}px ${multiplier * 2}px;
`

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: ${multiplier * 2}px;

  .react-calendar {
    transform: translateY(-50%);
  }
`

const StyledTextArea = styled(TextArea)`
  border: 1px solid ${colors.gray5};
  border-radius: 12px;
  min-height: 56px;
  padding: ${multiplier * 2}px;
`

const GlobalSettingsEditor = () => {
  const [date, setDate] = useState(null)
  const [settings, setSettings] = useState(null)
  const [showDateSelection, setShowDateSelection] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [time, setTime] = useState(null)

  useEffect(() => {
    const getSettings = async () => {
      const {
        data: { settings, success },
      } = await api.get('/global/getSystemSettings')

      if (success) {
        const { systemMessage } = systemSettingsSchema

        setSettings({
          ...systemSettingsSchema,
          ...settings,
          systemMessage: { ...systemMessage, ...settings.systemMessage },
        })
      }
    }

    getSettings()
  }, [])

  const clearSystemMessage = () => {
    saveSystemMessage({
      confirmMessage: 'Are you sure you want to clear the previous announcement?',
      settings: { ...settings, systemMessage: { ...systemSettingsSchema.systemMessage } },
    })
    setShowDateSelection(false)
    setDate(null)
    setTime(null)
  }

  const saveSystemMessage = async ({ confirmMessage = '', settings }) => {
    const confirmed = confirm(
      confirmMessage || 'Are you sure you want to publish a new announcement? This will clear the previous one (if one exists).'
    )

    if (confirmed) {
      let scheduledAt = ''

      if (date && time && showDateSelection) {
        scheduledAt = moment(date.setHours(moment(time, ['h A']).format('H'), 0, 0))
          .utc()
          .format('YYYY-MM-YY HH:MM:SS')
      }

      const {
        data: { success },
      } = await api.post('/global/publishSystemMessage', {
        settings: { ...settings, systemMessage: { ...settings.systemMessage, scheduledAt } },
      })

      if (success) {
        setSuccessMessage('Success!')
        setSettings(s => ({ ...s, ...settings }))
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    }
  }

  const renderSystemMessage = () => {
    return (
      <>
        <h4>System Announcement</h4>
        <StyledCard>
          <span>Announcement Type</span>
          <Dropdown
            onChange={e =>
              setSettings(s => ({
                ...s,
                systemMessage: {
                  ...s.systemMessage,
                  messageType: e.target.value,
                },
              }))
            }
            options={SYSTEM_MESSAGE_TYPE_NAMES.map((t, i) => ({ name: t, value: i }))}
            value={settings?.systemMessage.messageType}
          />
          <span style={{ margin: '20px 0 10px' }}>Announcement Text</span>
          <StyledTextArea
            grow
            onChange={e =>
              setSettings(s => ({
                ...s,
                systemMessage: {
                  ...s.systemMessage,
                  messageText: e.target.value,
                },
              }))
            }
            value={settings.systemMessage.messageText}
          />
          <Input
            border
            label='Announcement Url'
            onChange={e =>
              setSettings(s => ({
                ...s,
                systemMessage: {
                  ...s.systemMessage,
                  messageUrl: e.target.value,
                },
              }))
            }
            showLabel
            spacing='10px 0'
            value={settings.systemMessage.messageUrl}
          />
          <Input
            border
            label={'Release Notes Url (hamburger menu "See what\'s new" link)'}
            onChange={e =>
              setSettings(s => ({
                ...s,
                systemMessage: {
                  ...s.systemMessage,
                  releaseNotesUrl: e.target.value,
                },
              }))
            }
            showLabel
            spacing='10px 0'
            value={settings.systemMessage.releaseNotesUrl}
          />
          <div style={{ marginTop: 20 }}>
            <Checkbox checked={showDateSelection} onChange={() => setShowDateSelection(ds => !ds)} spacing='0 10px 0 0'>
              Schedule for a future date
            </Checkbox>
            {showDateSelection && <Schedule date={date} onChange={setDate} setTime={setTime} time={time} />}
          </div>
          <button
            disabled={!settings.systemMessage.messageText}
            onClick={() => saveSystemMessage({ settings })}
            style={{ marginTop: '20px' }}
          >
            Publish System Announcement
          </button>
          <button onClick={clearSystemMessage} style={{ marginTop: '20px' }}>
            Clear System Announcement
          </button>
          <span style={{ color: 'green', margin: '10px auto 20px', textAlign: 'center' }}>{successMessage}</span>
        </StyledCard>
      </>
    )
  }

  return <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px' }}>{settings && renderSystemMessage()}</div>
}

export default GlobalSettingsEditor

import { useEffect, useState } from 'react'

import { Checkbox, Input, LinkGroupsModal } from '@components'
import { api } from '@services'
import { clientSettingsSchema } from '@utils'

const ClientAccountEditor = () => {
  const [enableSaml, setEnableSaml] = useState(false)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const getSettings = async () => {
      const {
        data: { settings, success },
      } = await api.get('/config/clientAccounts/getSettings')

      if (success) {
        const { featureToggles, integrations, newsfeed, selfRegister, sentiment, surveys } = clientSettingsSchema
        setSettings({
          ...clientSettingsSchema,
          ...settings,
          featureToggles: { ...featureToggles, ...settings.featureToggles },
          integrations: { ...integrations, ...settings.integrations },
          newsfeed: { ...newsfeed, ...settings.newsfeed },
          selfRegister: { ...selfRegister, ...settings.selfRegister },
          sentiment: { ...sentiment, ...settings.sentiment },
          surveys: { ...surveys, ...settings.surveys },
        })

        if (settings.saml2) setEnableSaml(true)
      }
    }

    getSettings()
  }, [])

  const saveNewSettings = async () => {
    let newSettings = { ...settings }

    // Deleting integrations here, can remove just mailchimp after more integrations are added...KA
    if (!settings.integrations.mailchimp.disabled) {
      delete newSettings.integrations
    }

    // Just checking a couple of the fields so we don't save an empty saml2 object...KA
    if (!settings.saml2.ssoLoginUrl && !settings.saml2.serviceProviderCert) {
      delete newSettings.saml2
    }

    // If helpSupportUrl not different from system default, delete...KA
    if (settings.helpSupportUrl === clientSettingsSchema.helpSupportUrl) {
      delete newSettings.helpSupportUrl
    }

    // If sentiment object not different from system default, delete...KA
    if (JSON.stringify(settings.sentiment) === JSON.stringify(clientSettingsSchema.sentiment)) {
      delete newSettings.sentiment
    }

    const {
      data: { success },
    } = await api.post('/config/clientAccounts/updateSettings', { settings: newSettings })

    if (success) {
      setSuccessMessage('Success!')
      setSettings(s => ({ ...s, ...newSettings }))
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const renderFeatureToggles = () => {
    return (
      <div>
        <h4>Feature Toggles</h4>
        <Checkbox
          checked={settings.featureToggles.disableViewWambis}
          onChange={() =>
            setSettings(s => ({ ...s, featureToggles: { ...s.featureToggles, disableViewWambis: !s.featureToggles.disableViewWambis } }))
          }
          spacing='5px 10px'
        >
          Disable&nbsp;<strong>View recent Wambis</strong>&nbsp;menu item
        </Checkbox>
        <Checkbox
          checked={settings.featureToggles.notifications.email}
          onChange={() =>
            setSettings(s => ({
              ...s,
              featureToggles: {
                ...s.featureToggles,
                notifications: { ...s.featureToggles.notifications, email: !s.featureToggles.notifications.email },
              },
            }))
          }
          spacing='5px 10px'
        >
          Enable Email Notifications
        </Checkbox>
        <Checkbox
          checked={settings.featureToggles.notifications.sms}
          onChange={() =>
            setSettings(s => ({
              ...s,
              featureToggles: {
                ...s.featureToggles,
                notifications: { ...s.featureToggles.notifications, sms: !s.featureToggles.notifications.sms },
              },
            }))
          }
          spacing='5px 10px'
        >
          Enable SMS Notifications
        </Checkbox>
      </div>
    )
  }

  const renderIntegrations = () => {
    return (
      <div>
        <h4>Integrations</h4>
        <Checkbox
          checked={settings.integrations.mailchimp.disabled}
          onChange={() => {
            setSettings(s => ({
              ...s,
              integrations: {
                ...s.integrations,
                mailchimp: { ...s.integrations.mailchimp, disabled: !s.integrations.mailchimp.disabled },
              },
            }))
          }}
          spacing='5px 10px'
        >
          Disable Mailchimp
        </Checkbox>
        {/* TODO: Commenting out for now, put back when we need...KA */}
        {/* Also uncomment in clientSettingsSchema when putting back */}
        {/* {!settings.integrations.mailchimp.disabled && (
          <>
            <Input
              border
              label='API Key'
              onChange={e =>
                setSettings(s => ({
                  ...s,
                  integrations: {
                    ...s.integrations,
                    mailchimp: { ...s.integrations.mailchimp, apiKey: e.target.value },
                  },
                }))
              }
              showLabel
              spacing='5px 10px'
              value={settings.integrations.mailchimp.apiKey}
            />
            <Input
              border
              label='Audience ID'
              onChange={e =>
                setSettings(s => ({
                  ...s,
                  integrations: {
                    ...s.integrations,
                    mailchimp: { ...s.integrations.mailchimp, audienceId: e.target.value },
                  },
                }))
              }
              showLabel
              spacing='5px 10px'
              value={settings.integrations.mailchimp.audienceId}
            />
            <Input
              border
              label='Server'
              onChange={e =>
                setSettings(s => ({
                  ...s,
                  integrations: {
                    ...s.integrations,
                    mailchimp: { ...s.integrations.mailchimp, server: e.target.value },
                  },
                }))
              }
              showLabel
              spacing='5px 10px'
              value={settings.integrations.mailchimp.server}
            />
          </>
        )} */}
      </div>
    )
  }

  const renderNewsfeed = () => {
    return (
      <div>
        <h4>Newsfeed Settings</h4>
        <Checkbox
          checked={settings.newsfeed.disableCelebrations}
          onChange={() =>
            setSettings(s => ({
              ...s,
              newsfeed: {
                ...s.newsfeed,
                disableCelebrations: !s.newsfeed.disableCelebrations,
              },
            }))
          }
          spacing='5px 10px'
        >
          Disable Celebrations Widget
        </Checkbox>
      </div>
    )
  }

  const renderRootSettings = () => {
    return (
      <div>
        <h4>Root Settings</h4>
        <Checkbox
          checked={settings.disableTermsOfService}
          onChange={() => setSettings(s => ({ ...s, disableTermsOfService: !s.disableTermsOfService }))}
          spacing='5px 10px'
        >
          Disable Terms of Service
        </Checkbox>
        <Input
          border
          label='SSO Provider'
          onChange={e => setSettings(s => ({ ...s, ssoProvider: e.target.value }))}
          showLabel
          spacing='5px 10px'
          value={settings.ssoProvider}
        />
        <Input
          border
          label='Help Support URL'
          onChange={e => setSettings(s => ({ ...s, helpSupportUrl: e.target.value }))}
          showLabel
          spacing='5px 10px'
          value={settings.helpSupportUrl}
        />
      </div>
    )
  }

  const renderSaml2 = () => {
    return (
      <div>
        <h4>SAML2 Settings</h4>
        <Checkbox checked={enableSaml} onChange={() => setEnableSaml(es => !es)} spacing='5px 10px'>
          Enable SAML2 Settings
        </Checkbox>
        {enableSaml && (
          <>
            <Input
              border
              label='Identity Claim URI'
              onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, identityClaimUri: e.target.value } }))}
              showLabel
              spacing='5px 10px 20px'
              value={settings.saml2.identityClaimUri}
            />
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 10 }}>
              <span> Identity Provider Cert</span>
              <textarea
                defaultValue={atob(settings.saml2.identityProviderCert)}
                onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, identityProviderCert: btoa(e.target.value) } }))}
              />
            </div>
            <Input
              border
              label='Service Provider Key'
              onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, serviceProviderKey: e.target.value } }))}
              showLabel
              spacing='5px 10px 20px'
              value={settings.saml2.serviceProviderKey}
            />
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 10 }}>
              <span>Service Provider Cert</span>
              <textarea
                defaultValue={atob(settings.saml2.serviceProviderCert)}
                onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, serviceProviderCert: btoa(e.target.value) } }))}
              />
            </div>
            <Input
              border
              label='SSO Login URL'
              onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, ssoLoginUrl: e.target.value } }))}
              showLabel
              spacing='5px 10px'
              value={settings.saml2.ssoLoginUrl}
            />
            <Input
              border
              label='SSO Logout URL'
              onChange={e => setSettings(s => ({ ...s, saml2: { ...s.saml2, ssoLogoutUrl: e.target.value } }))}
              showLabel
              spacing='5px 10px'
              value={settings.saml2.ssoLogoutUrl}
            />
          </>
        )}
      </div>
    )
  }

  const renderSelfRegister = () => {
    return (
      <div>
        <h4>Self Register Settings</h4>
        <Input
          border
          label='Email Domains (comma separated)'
          onChange={e => setSettings(s => ({ ...s, selfRegister: { ...s.selfRegister, emailDomains: e.target.value } }))}
          showLabel
          spacing='5px 10px'
          value={settings.selfRegister.emailDomains}
        />
        <div style={{ display: 'flex' }}>
          <Input
            border
            label='Self Register Group ID'
            min={1}
            onChange={e =>
              setSettings(s => ({
                ...s,
                selfRegister: {
                  ...s.selfRegister,
                  groupId: Number(e.target.value),
                },
              }))
            }
            showLabel
            spacing='5px 10px'
            type='number'
            value={settings.selfRegister.groupId}
          />
          <button onClick={() => setIsGroupsModalOpen(true)} style={{ margin: 'auto', width: 150 }}>
            Find Group
          </button>
        </div>
      </div>
    )
  }

  const renderSentiment = () => {
    return (
      <div>
        <h4>Sentiment Analysis Settings</h4>
        <div style={{ display: 'flex' }}>
          <Input
            border
            label='Negative Threshold (0% to 100%)'
            max={100}
            min={0}
            onChange={e =>
              setSettings(s => ({
                ...s,
                sentiment: {
                  ...s.sentiment,
                  negativeThreshold: Number(e.target.value) / 100,
                },
              }))
            }
            showLabel
            spacing='5px 10px'
            step={1}
            type='number'
            value={
              settings.sentiment.negativeThreshold <= 1 ? settings.sentiment.negativeThreshold * 100 : settings.sentiment.negativeThreshold
            }
          />
          <button
            onClick={() =>
              setSettings(s => ({
                ...s,
                sentiment: {
                  ...s.sentiment,
                  negativeThreshold: clientSettingsSchema.sentiment.negativeThreshold,
                },
              }))
            }
            style={{ margin: 'auto', width: 150 }}
          >
            Set to default
          </button>
        </div>
      </div>
    )
  }

  const renderSurveys = () => {
    return (
      <div>
        <h4>Survey Settings</h4>
        <Checkbox
          checked={settings.surveys.disableCollectWambisLogout}
          onChange={() =>
            setSettings(s => ({
              ...s,
              surveys: {
                ...s.surveys,
                disableCollectWambisLogout: !s.surveys.disableCollectWambisLogout,
              },
            }))
          }
          spacing='5px 10px'
        >
          Disable Collect Wambis Logout
        </Checkbox>
        <Checkbox
          checked={settings.surveys.disableWambiWebPublish}
          onChange={() =>
            setSettings(s => ({
              ...s,
              surveys: {
                ...s.surveys,
                disableWambiWebPublish: !s.surveys.disableWambiWebPublish,
              },
            }))
          }
          spacing='5px 10px'
        >
          Disable Wambi Web Publish
        </Checkbox>
        <Input
          border
          label='Hot Streak Count'
          min={0}
          onChange={e =>
            setSettings(s => ({
              ...s,
              surveys: {
                ...s.surveys,
                hotStreakCount: Number(e.target.value),
              },
            }))
          }
          showLabel
          spacing='5px 10px'
          type='number'
          value={settings.surveys.hotStreakCount}
        />
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {settings && (
          <>
            {renderRootSettings()}
            {renderFeatureToggles()}
            {renderIntegrations()}
            {renderNewsfeed()}
            {renderSelfRegister()}
            {renderSentiment()}
            {renderSurveys()}
            {renderSaml2()}
          </>
        )}
        <button onClick={saveNewSettings} style={{ marginTop: '20px', width: '100%' }}>
          Save Settings
        </button>
        <span style={{ color: 'green', margin: '10px auto 20px auto', textAlign: 'center' }}>{successMessage}</span>
      </div>
      <LinkGroupsModal
        isGroupsModalOpen={isGroupsModalOpen}
        linkGroup={g => {
          setSettings(s => ({
            ...s,
            selfRegister: {
              ...s.selfRegister,
              groupId: Number(g.id),
            },
          }))
          setIsGroupsModalOpen(false)
        }}
        relatedGroups={[{ groupId: settings?.selfRegister?.groupId }]}
        setIsGroupsModalOpen={setIsGroupsModalOpen}
      />
    </>
  )
}

export default ClientAccountEditor

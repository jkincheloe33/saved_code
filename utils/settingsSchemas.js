import { SYSTEM_MESSAGE_TYPE } from './types'

export const clientSettingsSchema = {
  disableTermsOfService: false,
  featureToggles: {
    disableViewWambis: false,
    notifications: {
      sms: false,
      email: false,
    },
  },
  // mfaEnabled: false, don't really use
  newsfeed: {
    disableCelebrations: false,
  },
  saml2: {
    identityClaimUri: '',
    identityProviderCert: '',
    serviceProviderCert: '',
    serviceProviderKey: '',
    ssoLoginUrl: '',
    ssoLogoutUrl: '',
  },
  selfRegister: {
    emailDomains: '',
    groupId: null,
  },
  ssoProvider: '',
  surveys: {
    disableWambiWebPublish: false,
    disableCollectWambisLogout: false,
    hotStreakCount: 3,
  },

  // system settings overrides
  helpSupportUrl: 'https://wambi.freshdesk.com/support/tickets/new',
  integrations: {
    mailchimp: {
      disabled: false,
      // apiKey: '',
      // audienceId: '',
      // server: '',
    },
  },
  sentiment: {
    negativeThreshold: 0.5,
  },
}

export const systemSettingsSchema = {
  helpSupportUrl: 'https://wambi.freshdesk.com/support/tickets/new',
  integrations: {
    mailchimp: {
      disabled: false,
      apiKey: '',
      audienceId: '',
      server: '',
    },
  },
  sentiment: {
    negativeThreshold: 0.5,
  },
  systemMessage: {
    messageText: '',
    messageType: SYSTEM_MESSAGE_TYPE.INFO,
    messageUrl: '',
    releaseNotesUrl: '',
    scheduledAt: '',
  },
}

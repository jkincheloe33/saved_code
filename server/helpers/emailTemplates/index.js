// See this link for more detail about these templates (The library has a lot of built-in stuff)
// https://github.com/mjmlio/mjml/blob/master/doc/basic.md

module.exports = {
  authOTP: require('./authOTP'),
  expiringSurprises: require('./expiringSurprises'),
  failedScheduleWambiDraft: require('./failedScheduleWambiDraft'),
  giftConfirmation: require('./giftConfirmation'),
  giftReceive: require('./giftReceive'),
  groupWambiFromManager: require('./groupWambiFromManager'),
  groupWambiFromTeamMember: require('./groupWambiFromTeamMember'),
  hotStreak: require('./hotStreak'),
  individualWambiFromManager: require('./individualWambiFromManager'),
  individualWambiFromTeamMember: require('./individualWambiFromTeamMember'),
  notifiedGiftConfirmation: require('./notifiedGiftConfirmation'),
  patientFeedbackAlert: require('./patientFeedbackAlert'),
  perfectScore: require('./perfectScore'),
  profileChangesApproved: require('./profileChangesApproved'),
  profileChangesDenied: require('./profileChangesDenied'),
  raffleConfirmation: require('./raffleConfirmation'),
  raffleWinner: require('./raffleWinner'),
  reviewOTP: require('./reviewOTP'),
  sendReport: require('./sendReport'),
  wambiFromPatient: require('./wambiFromPatient'),
}

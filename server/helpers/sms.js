const Twilio = require('twilio')

const { handleBlacklist } = require('./smsHelpers')

import { getAccountLanguageByType } from '@serverHelpers/language'
import { defaultLanguages, LANGUAGE_TYPE } from '@utils'

const accountSid = process.env.TWILIO_ACCOUNT
const authToken = process.env.TWILIO_API_KEY
const twilioFrom = process.env.TWILIO_SENDER

const twilioClient = new Twilio(accountSid, authToken)

const __SEND__SMS = async ({ body, to }) => {
  const mobileNumbers = to.filter(t => Boolean(t.mobile))

  for (let i = 0; i < mobileNumbers.length; i++) {
    const { id, mobile } = { ...mobileNumbers[i] }

    try {
      await twilioClient.messages.create({
        body,
        from: twilioFrom,
        to: mobile,
      })
    } catch (error) {
      // Code 21610 is a Twilio error code for attempting to send to an unsubscribed recipient...KA
      if (Number(error.code) === 21610 && id) return handleBlacklist(mobileNumbers[i])

      console.error(`Error sending SMS to user with id ${id} and mobile number ${mobile}. `, error)
    }
  }
}

module.exports = {
  sendAuthOTP_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `Your Wambi Access Code: ${data.codeOTP}`,
    })

    return { success: true, data: smsResult }
  },
  sendGiftReceive_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `🎁 Gift Alert! Someone sent you a surprise, click the link to check it out! ${data.giftUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendGroupWambiFromManager_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `📬 You've got mail! ${data.senderName} just sent your group a very special Wambi! ${data.cpcUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendGroupWambiFromTeamMember_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `📬 You've got mail! ${data.senderName} just sent your group a Wambi! ${data.cpcUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendHotStreak_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      // eslint-disable-next-line
      body: `🔥 Hot Streak! You're on fire! Visit Wambi to check out more cheer ${data.url}`,
    })

    return { success: true, data: smsResult }
  },
  sendIndividualWambiFromManager_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `📬 You've got mail! ${data.senderName} just sent you a very special Wambi! ${data.cpcUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendIndividualWambiFromTeamMember_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `📬 You've got mail! ${data.senderName} sent you a Wambi! ${data.cpcUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendPatientFeedbackAlert_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `Action required for service recovery ${data.reviewUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendPerfectScore_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `🌟 Way to Wambi! 🌟 Congrats on a perfect score. Visit Wambi to check out more cheer ${data.url}`,
    })

    return { success: true, data: smsResult }
  },
  sendProfileChangesApproved_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `${data.managerName} has approved your profile changes in Wambi. Visit Wambi and send some gratitude! ${data.sendWambiUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendProfileChangesDenied_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `${data.managerName} has requested changes to your profile. Visit Wambi to make them now! ${data.editProfileUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendRaffleWinner_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `🎁 It's your lucky day! You won a raffle! ${data.giftUrl}`,
    })

    return { success: true, data: smsResult }
  },
  sendReviewOTP_SMS: async data => {
    const smsResult = await __SEND__SMS({
      ...data,
      body: `Your Wambi Review Access Code: ${data.codeOTP}`,
    })

    return { success: true, data: smsResult }
  },
  sendWambiFromPatient_SMS: async data => {
    const patientLanguage =
      (await getAccountLanguageByType({ clientAccountId: data.clientAccountId, type: LANGUAGE_TYPE.PATIENT })) ??
      defaultLanguages[LANGUAGE_TYPE.PATIENT]

    const smsResult = await __SEND__SMS({
      ...data,
      body: `📬 You've got mail! A ${patientLanguage.toLowerCase()} sent you a Wambi! ${data.cpcUrl}`,
    })

    return { success: true, data: smsResult }
  },
}

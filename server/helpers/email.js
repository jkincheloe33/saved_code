const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_SENDER_DOMAIN,
})

const emailTemplates = require('./emailTemplates')

const fromEmail = 'noreply@mailwambi.com'

const pageSize = 950

const __SEND__MAIL = async emailRequest => {
  let page = 0
  let pagedRes = []

  const recipients = emailRequest.bcc ? emailRequest.bcc.split(',') : emailRequest.to?.split(',') || []

  const trimmedRecipients = recipients.filter(r => r !== '')

  // Mailgun only allows 1000 recipients, so we are paging by 950 to be safe...KA
  while (page * pageSize <= trimmedRecipients.length) {
    const pageRows = trimmedRecipients.slice(page * pageSize, (page + 1) * pageSize)
    const toType = emailRequest.bcc ? 'bcc' : 'to'

    try {
      if (pageRows.length) {
        if (page > 0 || pageRows.length === pageSize) {
          console.error(`🚀 ~ Sending emails page ${page}, ${pageRows.length} recipients`)
        }

        const sendEmailRes = await new Promise((resolve, reject) => {
          mailgun.messages().send(
            {
              ...emailRequest,
              attachment:
                emailRequest?.attachment &&
                new mailgun.Attachment({ data: emailRequest.attachment.data, filename: emailRequest.attachment.fileName }),
              from: fromEmail,
              [toType]: pageRows.filter(r => Boolean(r)).join(','),
            },
            (error, response) => {
              if (error) reject(error)
              else resolve(response)
            }
          )
        })
        pagedRes.push(sendEmailRes)
      }
      page++
    } catch (error) {
      console.error(`🚀 ~ Error sending emails on page ${page} to ${pageRows.length} recipients`, error)
      page++
    }
  }
  return pagedRes
}

module.exports = {
  sendAuthOTP_Email: async (to, data) => {
    const emailResult = await __SEND__MAIL({
      to,
      ...(await emailTemplates.authOTP(data)),
    })

    return { success: true, data: emailResult }
  },
  sendExpiringSurprises_Email: async data => {
    const emailRes = []
    for (let i = 0; i < data.length; i++) {
      const emailData = data[i]
      const emailResult = await __SEND__MAIL({
        bcc: emailData.email,
        to: fromEmail,
        ...(await emailTemplates.expiringSurprises(emailData)),
      })
      emailRes.push(emailResult)
    }

    return { success: true, data: emailRes }
  },
  sendFailedScheduleWambiDraft_Email: async data => {
    const emailRes = []
    for (let i = 0; i < data.length; i++) {
      const emailData = data[i]
      const emailResult = await __SEND__MAIL({
        to: emailData.email,
        ...(await emailTemplates.failedScheduleWambiDraft(emailData)),
      })
      emailRes.push(emailResult)
    }

    return { success: true, data: emailRes }
  },
  sendGiftConfirmation_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.giftConfirmation(data)),
    })
    return { success: true, data: emailResult }
  },
  sendGiftReceive_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.giftReceive(data)),
    })
    return { success: true, data: emailResult }
  },
  sendGroupWambiFromManager_Email: async data => {
    const emailResult = await __SEND__MAIL({
      bcc: data.email,
      to: fromEmail,
      ...(await emailTemplates.groupWambiFromManager(data)),
    })
    return { success: true, data: emailResult }
  },
  sendGroupWambiFromTeamMember_Email: async data => {
    const emailResult = await __SEND__MAIL({
      bcc: data.email,
      to: fromEmail,
      ...(await emailTemplates.groupWambiFromTeamMember(data)),
    })
    return { success: true, data: emailResult }
  },
  sendHotStreak_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.hotStreak(data)),
    })

    return { success: true, data: emailResult }
  },
  sendIndividualWambiFromManager_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.individualWambiFromManager(data)),
    })
    return { success: true, data: emailResult }
  },
  sendIndividualWambiFromTeamMember_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.individualWambiFromTeamMember(data)),
    })
    return { success: true, data: emailResult }
  },
  sendNotifiedGiftConfirmation_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.notifyWhenClaimed,
      ...(await emailTemplates.notifiedGiftConfirmation(data)),
    })
    return { success: true, data: emailResult }
  },
  sendPatientFeedbackAlert_Email: async data => {
    // Send to either managers or portal notify on feedback email list...JC
    let emailRes = []
    if (data.managers?.length) {
      for (let i = 0; i < data.managers.length; i++) {
        const emailData = data.managers[i]
        const emailResult = await __SEND__MAIL({
          to: emailData.email,
          ...(await emailTemplates.patientFeedbackAlert({ ...data, ...emailData })),
        })
        emailRes.push(emailResult)
      }
    } else if (data.emails?.length) {
      emailRes = await __SEND__MAIL({
        bcc: data.emails,
        to: fromEmail,
        ...(await emailTemplates.patientFeedbackAlert(data)),
      })
    }
    return { success: true, data: emailRes }
  },
  sendPerfectScore_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.perfectScore(data)),
    })

    return { success: true, data: emailResult }
  },
  sendProfileChangesApproved_Email: async data => {
    for (let i = 0; i < data.people.length; i++) {
      const emailResult = await __SEND__MAIL({
        to: data.people[i].email,
        ...(await emailTemplates.profileChangesApproved({ ...data, ...data.people[i] })),
      })
      return { success: true, data: emailResult }
    }
  },
  sendProfileChangesDenied_Email: async data => {
    for (let i = 0; i < data.people.length; i++) {
      const emailResult = await __SEND__MAIL({
        to: data.people[i].email,
        ...(await emailTemplates.profileChangesDenied({ ...data, ...data.people[i] })),
      })
      return { success: true, data: emailResult }
    }
  },
  sendRaffleConfirmation_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.raffleConfirmation(data)),
    })
    return { success: true, data: emailResult }
  },
  sendRaffleWinner_Email: async data => {
    for (let i = 0; i < data.winners.length; i++) {
      const emailResult = await __SEND__MAIL({
        to: data.winners[i].email,
        ...(await emailTemplates.raffleWinner({ ...data, ...data.winners[i] })),
      })
      return { success: true, data: emailResult }
    }
  },
  sendReviewOTP_Email: async (to, data) => {
    const emailResult = await __SEND__MAIL({
      to,
      ...(await emailTemplates.reviewOTP(data)),
    })

    return { success: true, data: emailResult }
  },
  sendReport_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      attachment: data.attachment,
      subject: data.subject,
      ...(await emailTemplates.sendReport(data)),
    })
    return { success: true, data: emailResult }
  },
  sendWambiFromPatient_Email: async data => {
    const emailResult = await __SEND__MAIL({
      to: data.email,
      ...(await emailTemplates.wambiFromPatient(data)),
    })
    return { success: true, data: emailResult }
  },
}

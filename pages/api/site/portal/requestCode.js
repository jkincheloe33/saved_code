const randomize = require('randomatic')

import { sendReviewOTP_Email } from '@serverHelpers/email'
import { sendReviewOTP_SMS } from '@serverHelpers/sms'
import { USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    let {
      body: { email, mobile },
      clientAccount: { id: clientAccountId },
      systemSettings,
    } = req

    const code = randomize('0000')

    // regex replaces all non-numbers with an empty string...KA
    mobile = mobile.replace(/[^\d]/g, '')

    const mobileOrEmail = mobile ? 'mobile' : 'email'
    const mobileOrEmailVal = mobile ? mobile : email

    const existingReviewer = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id, firstName, lastName, isVolunteer, acceptedTermsAt, peopleId
        FROM reviewers
        WHERE ${mobileOrEmail} = ?
          AND accountId = ${clientAccountId}
      `,
      params: [mobileOrEmailVal],
    })

    if (mobile) {
      await sendReviewOTP_SMS({ codeOTP: code, to: [{ id: null, mobile }] })
    } else if (email) {
      await sendReviewOTP_Email(email, { codeOTP: code, helpSupportUrl: systemSettings.helpSupportUrl })
    }

    if (existingReviewer == null) {
      const reviewerInsertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO reviewers
          SET ?
        `,
        params: [{ accountId: clientAccountId, code, mobile: mobile || null, email: email || null }],
      })

      const [newReviewer] = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          SELECT id, firstName, lastName, isVolunteer, acceptedTermsAt, peopleId
          FROM reviewers
          WHERE id = ${reviewerInsertRes.insertId}
            AND accountId = ${clientAccountId}
        `,
      })

      res.json({ success: true, reviewer: newReviewer })
    } else {
      let userLinkedToMobileOrEmail = false
      if (!existingReviewer.peopleId) {
        // If user is linked to that mobile/email, set their reviewer record to use that peopleId
        userLinkedToMobileOrEmail = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT P.id AS peopleId
            FROM people P
            INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
            WHERE ${mobileOrEmail} = ?
              AND P.status = ${USER_STATUS.ACTIVE}
              AND P.isSelfRegistered = 0
          `,
          params: [mobileOrEmailVal],
        })
      }

      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE reviewers
          SET ?
          WHERE id = ?
        `,
        params: [
          {
            accountId: clientAccountId,
            code,
            ...(userLinkedToMobileOrEmail && { isVolunteer: 0, ...userLinkedToMobileOrEmail }),
          },
          existingReviewer.id,
        ],
      })

      res.json({
        success: updateRes.affectedRows === 1,
        reviewer: existingReviewer,
      })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

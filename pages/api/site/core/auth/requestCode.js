const randomize = require('randomatic')

import { sendAuthOTP_Email } from '@serverHelpers/email'
import { sendAuthOTP_SMS } from '@serverHelpers/sms'
import { USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { email, mobile },
      clientAccount: { id: clientAccountId, settings },
      systemSettings,
    } = req

    const code = randomize('000000')

    const mobileOrEmail = mobile ? 'mobile' : 'email'
    // regex replaces all non-numbers with an empty string...KA
    const mobileOrEmailVal = mobile ? mobile.replace(/[^\d]/g, '') : email

    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE ${mobileOrEmail} = ?
          AND P.status = ${USER_STATUS.ACTIVE}
          ${mobile ? 'AND P.isSelfRegistered = 0' : ''}
      `,
      params: [mobileOrEmailVal],
    })

    if (person) {
      const helpSupportUrl = settings.helpSupportUrl ?? systemSettings.helpSupportUrl

      if (mobile) await sendAuthOTP_SMS({ codeOTP: code, to: [{ ...person, mobile }] })
      else if (email) await sendAuthOTP_Email(email, { codeOTP: code, helpSupportUrl, minutes: 10, name: person.name })

      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE people
          SET ?, codeExpires = CURRENT_TIMESTAMP + INTERVAL 10 MINUTE
          WHERE id = ?
        `,
        params: [{ code }, person.id],
      })
    }

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error sending code' })
  }
}

const randomize = require('randomatic')
import { sendAuthOTP_Email } from '@serverHelpers/email'
import { sendAuthOTP_SMS } from '@serverHelpers/sms'

export default async (req, res) => {
  try {
    const {
      body: { email, mobile },
      clientAccount: { id: clientAccountId, settings },
      session: { userId },
      systemSettings,
    } = req

    const code = randomize('000000')

    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
          AND P.isSelfRegistered = 0
      `,
    })

    if (person) {
      const updateCode = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE people
          SET ?, codeExpires = CURRENT_TIMESTAMP + INTERVAL 1 HOUR
          WHERE id = ?
        `,
        params: [{ code }, person.id],
      })

      const helpSupportUrl = settings.helpSupportUrl ?? systemSettings.helpSupportUrl

      if (mobile) await sendAuthOTP_SMS({ codeOTP: code, to: [{ ...person, mobile }] })
      else if (email) await sendAuthOTP_Email(email, { codeOTP: code, helpSupportUrl, minutes: 60, name: person.name })

      res.json({ success: updateCode.changedRows === 1 })
    } else {
      res.json({ success: false, msg: 'An error occurred - user not found' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

import randomize from 'randomatic'
import { v4 as uuidv4 } from 'uuid'

import { sendAuthOTP_Email } from '@serverHelpers/email'

export default async (req, res) => {
  const {
    body: { email, uid },
    clientAccount: { id: clientAccountId, settings },
    systemSettings,
  } = req

  try {
    const emailExists = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE P.email = ?
      `,
      params: [email],
    })

    if (emailExists) return res.json({ success: false, msg: 'Invalid email' })

    const code = randomize('000000')

    const helpSupportUrl = settings.helpSupportUrl || systemSettings.helpSupportUrl

    if (email) await sendAuthOTP_Email(email, { codeOTP: code, helpSupportUrl, minutes: 10 })

    const updateCode = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE selfRegisterCodes
        SET code = ?,
          expiresAt = CURRENT_TIMESTAMP + INTERVAL 10 MINUTE
        WHERE accountId = ${clientAccountId}
          AND email = ?
          AND uid = ?
          AND expiresAt > CURRENT_TIMESTAMP
      `,
      params: [code, email, uid],
    })

    if (updateCode.changedRows === 1) return res.json({ success: true })

    const uuid = uuidv4()

    const insertCode = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO selfRegisterCodes
        SET ?, expiresAt = CURRENT_TIMESTAMP + INTERVAL 10 MINUTE
      `,
      params: [
        {
          accountId: clientAccountId,
          code,
          email,
          uid: uuid,
        },
      ],
    })
    res.json({ success: insertCode.affectedRows === 1, uuid })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error sending code' })
  }
}

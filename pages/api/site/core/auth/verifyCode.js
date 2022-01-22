const { createUserSession, recordLoginAttempt } = require('@serverHelpers/sessions')
import { setCookie, USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { code, email, mobile },
      clientAccount: { id: clientAccountId },
    } = req

    const mobileOrEmail = mobile ? 'mobile' : 'email'
    // regex replaces all non-numbers with an empty string...KA
    const mobileOrEmailVal = mobile ? mobile.replace(/[^\d]/g, '') : email

    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id, P.passwordHash, P.isSelfRegistered
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE ${mobileOrEmail} = ?
          AND P.status = ${USER_STATUS.ACTIVE}
          AND P.code = ?
          AND P.codeExpires > CURRENT_TIMESTAMP
          ${mobile ? 'AND P.isSelfRegistered = 0' : ''}
      `,
      params: [mobileOrEmailVal, code],
    })

    if (person != null) {
      const { msg, sessionId, sessionToken, success } = await createUserSession({ req, wambiUser: person })
      recordLoginAttempt({ req, userId: person.id, sessionId })

      if (success) {
        setCookie({ res, token: sessionToken, tokenAlias: 'tkn' })

        // Clear password so user has to set password...CY
        await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE people
            SET ?
            WHERE id = ?
          `,
          params: [{ code: null, passwordHash: null }, person.id],
        })

        res.json({ success, token: sessionToken })
      } else {
        res.json({ success: false, msg })
      }
    } else {
      recordLoginAttempt({ req, attemptedUser: email || mobile })
      res.json({ success: false, msg: 'Invalid code, please try again.' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

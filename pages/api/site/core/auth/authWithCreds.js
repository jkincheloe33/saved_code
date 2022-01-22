const { verifyPassword } = require('@serverHelpers/security')
const { createUserSession, recordLoginAttempt } = require('@serverHelpers/sessions')

import { setCookie, USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { loginId, password },
      clientAccount: { id: clientAccountId },
    } = req

    // Get the user specified in the login field...EK
    const wambiUser = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id, P.passwordHash, P.isSelfRegistered
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE P.loginId = ?
          AND P.status = ${USER_STATUS.ACTIVE}
          AND P.isSelfRegistered = 0
      `,
      params: [loginId],
    })

    if (wambiUser?.passwordHash) {
      // Verify the password...EK
      const isValidPassword = await verifyPassword(password, wambiUser.passwordHash)

      if (isValidPassword) {
        const { msg, sessionId, sessionToken, success } = await createUserSession({ req, wambiUser })
        // Record the successful attempt (Don't await it)...EK
        recordLoginAttempt({ req, userId: wambiUser.id, sessionId })

        if (success) {
          setCookie({ res, token: sessionToken, tokenAlias: 'tkn' })
          res.json({ success: true, token: sessionToken })
        } else {
          return res.json({ success: false, msg })
        }
      } else {
        // Record the failed attempt - missing sessionId (Don't await it)...EK
        recordLoginAttempt({ req, userId: wambiUser.id })

        return res.json({ success: false, msg: 'Username / Password not found' })
      }
    } else {
      // Record the failed attempt (Don't await it)...EK
      recordLoginAttempt({ req, attemptedUser: loginId })

      return res.json({ success: false, msg: 'Username / Password not found' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}

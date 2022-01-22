const { issueReAuthToken } = require('@serverHelpers/sessions')
const { verifyPassword } = require('@serverHelpers/security')

import { setCookie } from '@utils'

export default async (req, res) => {
  const {
    body: { password },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.passwordHash
        FROM people P
        INNER JOIN clientAccountPeople CAP on (CAP.peopleId = P.id and CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
      `,
    })

    if (person != null) {
      const passwordMatch = await verifyPassword(password, person.passwordHash)

      if (passwordMatch) {
        const { reAuthToken } = await issueReAuthToken(person)

        setCookie({ maxAge: 5 * 60, res, token: reAuthToken, tokenAlias: 'reauth-tkn' })
        res.json({ success: true, token: reAuthToken })
      } else {
        res.json({ success: false, msg: 'Incorrect password' })
      }
    } else {
      res.json({ success: false, msg: 'Person not found' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

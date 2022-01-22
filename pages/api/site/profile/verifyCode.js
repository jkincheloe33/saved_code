const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { TRIGGERS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      body: { code, email, mobile },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const mobileOrEmail = mobile ? 'mobile' : 'email'
    const mobileOrEmailVal = mobile ? mobile : email

    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
          AND P.code = ?
          AND P.codeExpires > CURRENT_TIMESTAMP
          AND P.isSelfRegistered = 0
      `,
      params: [code],
    })

    if (person) {
      const updateMobileOrEmail = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE people
          SET ?
          WHERE id = ?
        `,
        params: [{ code: null, [mobileOrEmail]: mobileOrEmailVal }, person.id],
      })

      if (mobile) {
        const { completedChallenges, rewardProgress } = await handleChallenges({
          clientAccountId,
          req,
          triggers: [TRIGGERS.PROFILE_ADD_MOBILE],
          userId,
        })
        res.json({ success: updateMobileOrEmail.changedRows === 1, completedChallenges, rewardProgress })
      } else {
        res.json({ success: updateMobileOrEmail.changedRows === 1 })
      }
    } else {
      res.json({ success: false, msg: 'Invalid code, please try again.' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

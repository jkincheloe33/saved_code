const { hashPassword, checkPasswordStrength } = require('@serverHelpers/security')

export default async (req, res) => {
  const {
    body: { newPassword, peopleId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const strongPassword = checkPasswordStrength(newPassword)

    if (strongPassword.valid) {
      // See if the people record exists (in the account I am currently pointed to)...EK
      const person = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT P.id, P.passwordHash
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ?
            AND P.isSelfRegistered = 0
        `,
        params: [peopleId],
      })

      if (person != null) {
        // For now, just update it but we need to do a comprehensive security review...EK
        const resetResponse = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE people
            SET passwordHash = ?,
              passwordChangedAt = NOW()
            WHERE id = ?
          `,
          params: [await hashPassword(newPassword), person.id],
        })

        res.json({ success: resetResponse.changedRows === 1 })
      } else {
        res.json({ success: false, msg: 'Invalid person specified' })
      }
    } else {
      res.json({ success: false, msg: 'Password not strong enough', data: strongPassword.checksFailed })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error setting password' })
  }
}

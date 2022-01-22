const { hashPassword, checkPasswordStrength, verifyPassword } = require('@serverHelpers/security')

export default async (req, res) => {
  if (req.method === 'POST') {
    const {
      body: { newPassword },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    try {
      const person = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT P.passwordHash
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ${userId}
        `,
      })

      if (person != null) {
        const strongPassword = checkPasswordStrength(newPassword)
        if (strongPassword.valid) {
          let newPasswordMatch = false

          // Run this if the user is not setting a password...CY
          if (person.passwordHash != null) {
            newPasswordMatch = await verifyPassword(newPassword, person.passwordHash)
          }

          if (Boolean(newPasswordMatch) === false || person.passwordHash == null) {
            let resetResponse = await wambiDB.executeNonQuery({
              commandText: /*sql*/ `
                UPDATE people
                SET passwordHash = ?,
                  passwordChangedAt = NOW()
                WHERE id = ${userId}
              `,
              params: [await hashPassword(newPassword)],
            })
            res.json({ success: resetResponse.changedRows === 1 })
          } else {
            res.json({ success: false, msg: 'New password cannot match your old password' })
          }
        } else {
          res.json({ success: false, msg: 'Password not strong enough' })
        }
      } else {
        res.json({ success: false, msg: 'Person not found' })
      }
    } catch (error) {
      logServerError({ error, req })
      res.json({ success: false })
    }
  }
}

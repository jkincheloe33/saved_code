const { verifyJwt } = require('@serverHelpers/security')
import { parseCookies } from 'nookies'

export default async (req, res) => {
  try {
    const {
      body: {
        volunteerInfo: { firstName, lastName, reviewerId },
      },
      clientAccount: { id: clientAccountId },
    } = req

    const { review_tkn } = parseCookies({ req })

    let {
      r: [id],
    } = await verifyJwt(review_tkn)

    if (id === reviewerId) {
      const newVolunteerRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE reviewers
          SET firstName = ?, lastName = ?, isVolunteer = 1
          WHERE id = ?
            AND accountId = ${clientAccountId}
            AND isVolunteer = 0
        `,
        params: [firstName, lastName, reviewerId],
      })
      if (newVolunteerRes.changedRows === 1) {
        res.json({ success: true })
      } else {
        res.json({ msg: 'Unable to create volunteer', success: false })
      }
    } else {
      res.json({ success: false, msg: 'Invalid reviewer id provided' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

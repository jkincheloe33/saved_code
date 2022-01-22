// Refetches reviewer data w/ review tkn validation...JC
const { verifyJwt } = require('@serverHelpers/security')
import { parseCookies } from 'nookies'

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
    } = req

    const { review_tkn } = parseCookies({ req })

    let {
      r: [id],
    } = await verifyJwt(review_tkn)
    let reviewer

    if (id) {
      reviewer = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT R.id, R.firstName, R.lastName, R.isVolunteer, R.acceptedTermsAt, R.peopleId, 
          COUNT(S.reviewerId) AS reviewsCompleted
          FROM reviewers R
          LEFT JOIN surveys S ON (S.reviewerId = R.id)
          WHERE R.id = ${id}
            AND R.accountId = ${clientAccountId}
        `,
      })

      res.json({ reviewer, success: true })
    } else {
      res.json({ msg: 'Invalid reviewer id', success: false })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

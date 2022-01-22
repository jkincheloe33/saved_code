import { signJwt } from '@serverHelpers/security'
import { setCookie } from '@utils'

const reviewTokenDuration = '1h'

export default async (req, res) => {
  try {
    const { code, reviewerId } = req.body

    const reviewer = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT R.id, R.firstName, R.lastName, R.isVolunteer, R.acceptedTermsAt, R.peopleId, 
        COUNT(S.reviewerId) AS reviewsCompleted
        FROM reviewers R
        LEFT JOIN surveys S ON (S.reviewerId = R.id)
        WHERE R.id = ? 
          AND R.code = ?
      `,
      params: [reviewerId, code],
    })

    if (reviewer?.id != null) {
      // Use this new insert Id as the reviewer...EK
      if (reviewer.acceptedTermsAt == null) {
        await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE reviewers 
            SET acceptedTermsAt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `,
          params: [reviewerId],
        })

        reviewer.acceptedTermsAt = new Date()
      }

      // create a review tkn, assign as cookie and return success with the token payload...EK
      let reviewTkn = signJwt(
        {
          r: [reviewerId],
        },
        reviewTokenDuration
      )

      setCookie({ res, token: reviewTkn, tokenAlias: 'review_tkn' })

      res.json({ success: true, reviewer })
    } else {
      res.json({ success: false, message: 'Bad code or reviewer Id for this account' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

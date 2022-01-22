const { verifyJwt } = require('@serverHelpers/security')
import { FOLLOW_UP_STATUS } from '@utils'
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

    let reviewerContactInfo = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT DISTINCT
          IFNULL(S.firstName, '') AS firstName,
          IFNULL(S.lastName, '') AS lastName,
          IFNULL(S.email, '') AS email,
          IFNULL(S.mobile, '') AS mobile
        FROM surveys S
        -- This join ensures contact info does not prefill when reviewing from 'Get Others recognized' workflow..JC
        INNER JOIN reviewers R ON (R.id = S.reviewerId AND R.peopleId IS NULL)
        WHERE S.reviewerId = ?
          AND S.accountId = ${clientAccountId}
          AND S.followUpStatus = ?
        ORDER BY S.createdAt DESC
      `,
      params: [id, FOLLOW_UP_STATUS.REQUESTED],
    })

    if (reviewerContactInfo) res.json({ success: true, reviewerContactInfo })
    else res.json({ success: true, msg: 'Could not find contact info for this reviewer' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

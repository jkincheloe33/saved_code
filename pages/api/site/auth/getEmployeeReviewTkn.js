import { signJwt } from '@serverHelpers/security'

import { setCookie, USER_STATUS } from '@utils'

const reviewTokenDuration = '1h'

export default async (req, res) => {
  try {
    let {
      body: { email, mobile },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    email = email || null
    mobile = mobile || null

    // Validate people record against req body and userId...JC
    const userRecord = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.mobile, P.email
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
          ${mobile ? ` AND P.mobile = ${wambiDB.escapeValue(mobile)}` : ' '}
          ${email ? ` AND P.email = ${wambiDB.escapeValue(email)}` : ' '}
          AND P.status = ${USER_STATUS.ACTIVE}
      `,
    })

    if (userRecord) {
      // Check for all reviewer records that match the users email, mobile, & userId...JC
      const existingReviewRecords = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT id, firstName, lastName, isVolunteer, acceptedTermsAt, peopleId, mobile, email
          FROM reviewers
          WHERE (
            mobile = ?
            OR email = ?
            OR peopleId = ${userId}
          )
            AND accountId = ${clientAccountId}
          ORDER BY id DESC
        `,
        params: [mobile, email],
      })

      let reviewer
      let reviewerId
      if (existingReviewRecords.length) {
        // Set reviewer to the most recent record...JC
        reviewer = existingReviewRecords[0]
        reviewerId = reviewer.id

        // Link review records that don't have user id...JC
        const unlinkedReviewRecords = existingReviewRecords.filter(r => !r.peopleId)

        if (unlinkedReviewRecords.length) {
          const linkReviewersRes = await wambiDB.executeNonQuery({
            commandText: /*sql*/ `
              UPDATE reviewers
              SET peopleId = ${userId}, isVolunteer = 0
              WHERE id IN (${unlinkedReviewRecords.map(r => r.id)})
            `,
          })

          if (linkReviewersRes.affectedRows > 0) {
            reviewer.peopleId = userId
            reviewer.isVolunteer = 0
          }
        }
      } else {
        const reviewerInsertRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            INSERT INTO reviewers 
            SET ?
          `,
          params: [{ accountId: clientAccountId, email, mobile, peopleId: userId }],
        })

        reviewerId = reviewerInsertRes.insertId

        reviewer = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT id, firstName, lastName, isVolunteer, acceptedTermsAt, peopleId
            FROM reviewers
            WHERE id = ${reviewerInsertRes.insertId}
              AND accountId = ${clientAccountId}
          `,
        })
      }

      //Add userId as collectorId for collection review challenge...CY
      let reviewTkn = signJwt(
        {
          r: [reviewerId, null, userId],
        },
        reviewTokenDuration
      )

      setCookie({ res, token: reviewTkn, tokenAlias: 'review_tkn' })

      res.json({ success: true, reviewer, reviewTkn })
    } else {
      res.json({ success: false, msg: 'User does not have permission' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')

const limit = 10

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { page = 0 },
      session: { userId },
    } = req

    // We're purposely not blocking managers from seeing reviews on themselves, or commenting / following up...JC
    const surveys = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT S.id, S.comment, S.followUpStatus, S.createdAt,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS recipientName,
          COUNT(DISTINCT SN.id) AS noteCount,
          MIN(SR.rating) AS lowestScore
        FROM surveys S
        INNER JOIN (
          ${selectLeaderPeople({ clientAccountId, userId })}
        ) PM ON (S.peopleId = PM.id)
        LEFT JOIN surveyNotes SN ON (S.id = SN.surveyId)
        INNER JOIN surveyResponses SR ON (S.id = SR.surveyId)
        INNER JOIN portals PO ON (S.portalId = PO.id)
        INNER JOIN people P ON (S.peopleId = P.id AND P.isSelfRegistered = 0)
        WHERE S.accountId = ${clientAccountId}
          AND SR.rating <= PO.commentPromptThreshold
        GROUP BY S.id
        ORDER BY S.createdAt DESC
        LIMIT ?, ?
      `,
      params: [page * limit, limit],
    })

    res.json({ success: true, surveys })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

const { FEED_ITEM_STATUS, FEED_ITEM_TYPES, USER_STATUS } = require('@utils/types')

const LIMIT = 2

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  //Limit recently sent cpc to 200 recipients...CY
  const MAX_FEED_LIMIT = 200

  try {
    const recentCpcIds = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT FI.id
        FROM feedItems FI
        INNER JOIN feedPeople FP ON (FP.feedId = FI.id)
        WHERE FI.authorId = ${userId}
          AND FI.accountId = ${clientAccountId}
          AND FI.itemType = ${FEED_ITEM_TYPES.CPC}
          AND FI.status <> ${FEED_ITEM_STATUS.HIDDEN}
        GROUP BY FI.id
        HAVING COUNT(FP.feedId) > 1
          AND COUNT(FP.feedId) < ${MAX_FEED_LIMIT}
        ORDER BY FI.createdAt DESC
        LIMIT ${LIMIT}
      `,
    })

    if (recentCpcIds.length > 0) {
      const ids = recentCpcIds.map(r => r.id)

      const recipientsList = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT FP.feedId, P.id, P.isSelfRegistered,
            IFNULL(NULLIF(P.jobTitleDisplay, ''), P.jobTitle) jobTitle,
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
            IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
          INNER JOIN feedPeople FP ON (P.id = FP.peopleId AND FP.feedId IN (${ids}))
          LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = "thumbnail" AND ML.tableName = "people")
          LEFT JOIN media M ON (ML.mediaId = M.id)
          WHERE P.status = ${USER_STATUS.ACTIVE}
        `,
      })

      const recentlySent = ids.map(id => recipientsList.filter(rs => rs.feedId === id))

      res.json({ success: true, recentlySent })
    } else {
      res.json({ success: true, recentlySent: [] })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

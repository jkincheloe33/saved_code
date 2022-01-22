const { getWambis } = require('@serverHelpers/wambi')

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    const user = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id, P.pronouns, P.isSelfRegistered,
          IFNULL(NULLIF(P.jobTitle, ''), P.jobTitleDisplay) AS jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
          GROUP_CONCAT(G.name ORDER BY G.name separator ', ') groupName
        FROM people P
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
        INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail'  AND ML.tableName = 'people')
        LEFT JOIN media M on (ML.mediaId = M.id)
        WHERE P.id = ?
        GROUP BY P.id
      `,
      params: [userSessionId],
    })

    const { cpc } = await getWambis({
      clientAccountId,
      isMe: true,
      limit: 2,
      type: 'both',
      userId: userSessionId,
      userSessionId,
    })

    res.json({ success: true, cpc, user })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

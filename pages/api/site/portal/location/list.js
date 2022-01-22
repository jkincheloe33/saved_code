export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    query: { id },
  } = req

  try {
    let shortUid = id

    if (!shortUid) {
      const shortUidQuery = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT P.shortUid
          FROM portals P
          WHERE accountId = ${clientAccountId}
          ORDER BY P.id
        `,
      })

      shortUid = shortUidQuery.shortUid
    }

    const locationQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, G.name, G.shortTitle, G.longTitle,
          P.donationLink, P.showReviewFollowup, P.commentPromptThreshold, P.disableTranslations,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM groups G
        INNER JOIN groupTypes GT ON (GT.id = G.groupTypeId AND GT.isLocation = 1)
        LEFT JOIN mediaLink ML ON (ML.tableKey = G.id AND ML.tableName = 'groups' AND ML.usage = 'thumbnail')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN groupIndex GI ON (GI.fromGroupId = G.id)
        LEFT JOIN portalGroups PG ON (GI.groupId = PG.groupId)
        INNER JOIN portals P ON (P.id = PG.portalId AND P.shortUid = ?)
        WHERE G.accountId = ${clientAccountId}
          AND G.hideFromPortal = 0
        GROUP BY G.id
        ORDER BY G.name
      `,
      params: [shortUid],
    })

    const portalSettingsQuery = wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT
          GROUP_CONCAT(DISTINCT GTT.name SEPARATOR ', ') AS groupFilterName,
          GROUP_CONCAT(DISTINCT TTT.name SEPARATOR ', ') AS traitFilterName
        FROM groupTypes GTT
        LEFT JOIN traitTypes TTT ON (TTT.isReviewFilter = 1 AND TTT.accountId = ${clientAccountId})
        WHERE GTT.isReviewFilter = 1
          AND GTT.accountId = ${clientAccountId}
      `,
      params: [shortUid],
    })

    const [locationsList, portalSettings] = await Promise.all([locationQuery, portalSettingsQuery])

    const locations = locationsList.map(location => ({ ...location, shortUid, ...portalSettings }))

    res.json({ success: true, locations, shortUid })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

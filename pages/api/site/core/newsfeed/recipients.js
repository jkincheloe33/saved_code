const pageSize = 20

export default async (req, res) => {
  const {
    body: { feedId, page = 0 },
    session,
  } = req

  try {
    const recipientsList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.isSelfRegistered,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(P.jobTitleDisplay, P.jobTitle) AS title,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
        FROM people P
        INNER JOIN feedPeople FP ON (FP.peopleId = P.id)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE FP.feedId = ?
        -- Putting user first, then people with images, then everyone else in the order added...JK
        ORDER BY (P.id != ${session.userId}), (ML.id IS null), FP.id
        LIMIT ?, ?
      `,
      params: [feedId, page * pageSize, pageSize],
    })

    if (recipientsList.length) res.json({ success: true, recipientsList })
    else res.json({ success: false, msg: 'Recipients not found' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

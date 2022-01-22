const limit = 20

export default async (req, res) => {
  const {
    body: { feedId, page = 0 },
    clientAccount,
  } = req

  try {
    const comments = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT FC.id, FC.feedId, FC.comment, FC.createdAt, FC.authorId,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) as name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS authorImg
        FROM feedComments FC
        INNER JOIN feedItems FI ON (FC.feedId = FI.id AND FI.accountId = ${clientAccount.id})
        INNER JOIN people P ON (FC.authorId = P.id)
        LEFT JOIN mediaLink MLA ON (FC.authorId = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
        WHERE FC.feedId = ?
        ORDER BY FC.createdAt DESC
        LIMIT ${page * limit}, ${limit}
      `,
      params: [feedId],
    })

    res.json({ success: true, comments })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

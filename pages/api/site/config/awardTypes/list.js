export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const awardTypesForAccount = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT T.*,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon
        FROM awardTypes T
        LEFT JOIN mediaLink ML ON (T.id = ML.tableKey AND ML.tableName = 'awardTypes' AND ML.usage = 'icon')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE T.accountId = ${clientAccountId}
        ORDER BY T.name ASC
      `,
    })

    res.json({ success: true, awardTypesForAccount })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

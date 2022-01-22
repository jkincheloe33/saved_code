export default async (req, res) => {
  const { clientAccount, query } = req

  try {
    const steps = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT LS.*, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM lessonSteps LS
        INNER JOIN lessons L ON (L.accountId = ${clientAccount.id} AND L.id = LS.lessonId)
        LEFT JOIN mediaLink ML ON (LS.id = ML.tableKey AND ML.tableName = 'lessonSteps' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE LS.lessonId = ?
        ORDER BY LS.order
      `,
      params: [query.id],
    })

    res.json({ success: true, steps })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

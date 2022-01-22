export default async (req, res) => {
  let reactionsForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT R.*, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon
      FROM reactions R
      LEFT JOIN mediaLink ML ON (R.id = ML.tableKey AND ML.tableName = 'reactions' AND ML.usage = 'icon')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE R.accountId = ?
      ORDER BY R.name ASC
    `,
    params: [req.clientAccount.id],
  })

  res.json({ success: true, reactionsForAccount })
}

export default async (req, res) => {
  const imageOptionsForTheme = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT ML.id, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) As imageOption
      FROM challengeThemes CT
      INNER JOIN mediaLink ML ON (ML.tableName = 'challengeThemes' AND ML.tableKey = CT.id)
      INNER JOIN media M ON (ML.mediaId = M.id)
      WHERE CT.id = ? AND CT.accountId = ?
    `,
    params: [req.body.challengeThemeId, req.clientAccount.id],
  })

  res.json({ success: true, imageOptionsForTheme })
}

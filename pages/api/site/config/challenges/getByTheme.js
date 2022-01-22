export default async (req, res) => {
  try {
    const { challengeThemeId } = req.body

    const challengesForTheme = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT C.*,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) image,
          COUNT(CP.id) participants
        FROM challenges C
        INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id AND CT.accountId = ? AND CT.id = ?)
        LEFT JOIN challengeProgress CP ON (C.id = CP.challengeId)
        LEFT JOIN mediaLink ML ON (ML.tableName = 'challenges' AND ML.tableKey = C.id AND ML.usage = 'challenge')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        GROUP BY C.id
        ORDER BY C.title ASC
      `,
      params: [req.clientAccount.id, challengeThemeId],
    })

    res.json({ success: true, challengesForTheme })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

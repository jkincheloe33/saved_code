export default async (req, res) => {
  try {
    const {
      body: { rewardLevelId },
      clientAccount: { id: clientAccountId },
    } = req
    const gifts = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RG.*,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM rewardGifts RG
        LEFT JOIN mediaLink ML ON (RG.id = ML.tableKey AND ML.tableName = 'rewardGifts' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE RG.accountId = ${clientAccountId} AND RG.rewardLevelId = ?
        ORDER BY RG.order
      `,
      params: [rewardLevelId],
    })

    res.json({ success: true, gifts })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

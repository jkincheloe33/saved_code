export default async (req, res) => {
  const { clientAccount } = req

  try {
    const groupTypesForAccount = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT GT.*, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon
        FROM groupTypes GT
        LEFT JOIN mediaLink ML ON (GT.id = ML.tableKey AND ML.tableName = 'groupTypes' AND ML.usage = 'icon')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE GT.accountId = ${clientAccount.id}
        ORDER BY GT.name ASC
      `,
    })

    res.json({ success: true, groupTypesForAccount })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

export default async (req, res) => {
  const {
    body: { peopleId },
    clientAccount,
  } = req

  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE ML
        FROM mediaLink ML
        INNER JOIN media M ON (M.id = ML.mediaId AND M.accountId = ${clientAccount.id})
        WHERE ML.tableName = 'people'
          AND ML.tableKey = ?
          AND ML.usage IN ('original', 'thumbnail')
      `,
      params: [peopleId],
    })

    res.json({ success: deleteRes.affectedRows > 0 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

export default async (req, res) => {
  try {
    const {
      body: { reportId },
      clientAccount: { id: clientAccountId },
    } = req

    const relatedTraits = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RT.id, RT.traitId, T.name, TT.name AS traitTypeName
        FROM reportTraits RT
        INNER JOIN reports R ON (RT.reportId = R.id AND R.accountId = ${clientAccountId})
        INNER JOIN traits T ON (T.id = RT.traitId)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId)
        WHERE RT.reportId = ?
        ORDER BY traitTypeName, T.name
      `,
      params: [reportId],
    })

    res.json({ success: true, relatedTraits })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

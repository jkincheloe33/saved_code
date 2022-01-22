export default async (req, res) => {
  const {
    body: { search = '' },
    clientAccount,
  } = req

  try {
    const term = wambiDB.escapeValue(`%${search.trim()}%`)

    const traitsList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT T.id, T.name,
          TT.name AS traitTypeName
        FROM traits T
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId AND TT.accountId = ${clientAccount.id})
        WHERE (
          T.name LIKE ${term}
          OR TT.name LIKE ${term}
        )
        ORDER BY traitTypeName, T.name
      `,
    })

    res.json({ success: true, traitsList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

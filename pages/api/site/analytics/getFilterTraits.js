export default async (req, res) => {
  const {
    body: { dashboardId, search = '', traitTypeId },
    clientAccount,
    session: { userId },
  } = req

  try {
    const term = wambiDB.escapeValue(`%${search.trim()}%`)

    const { limitedToUserTraits } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT limitedToUserTraits
        FROM dashboards
        WHERE id = ?
      `,
      params: [dashboardId],
    })

    const userTraitsClause = limitedToUserTraits ? `INNER JOIN peopleTraits PT ON (T.id = PT.traitId AND PT.peopleId = ${userId})` : ''

    const traitsForType = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT T.id, T.traitTypeId, T.name
        FROM traits T
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ${clientAccount.id})
        ${userTraitsClause}
        WHERE T.traitTypeId = ?
          AND T.name LIKE ${term}
        GROUP BY T.id
    `,
      params: [traitTypeId],
    })

    res.json({ success: true, traitsForType })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

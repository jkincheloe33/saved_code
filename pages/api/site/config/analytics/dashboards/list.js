export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const dashboards = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT D.id, D.name, D.description, D.defaultDateRange, D.dateRangeHidden, D.filterTraitTypeId, D.groupFilterHidden, D.limitedToUserTraits, D.order,
          TT.name AS filterTraitTypeName
        FROM dashboards D
        LEFT JOIN traitTypes TT ON (TT.id = D.filterTraitTypeId)
        WHERE D.accountId = ${clientAccountId}
        ORDER BY D.order ASC
    `,
    })

    res.json({ success: true, dashboards })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get dashboards' })
  }
}

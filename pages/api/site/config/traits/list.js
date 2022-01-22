export default async (req, res) => {
  const {
    body: { traitTypeId },
    clientAccount,
  } = req

  try {
    const traitsForType = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT T.*,
          COUNT(PT.peopleId) AS members
        FROM traits T
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ${clientAccount.id})
        LEFT JOIN peopleTraits PT ON (T.id = PT.traitId)
        WHERE T.traitTypeId = ?
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

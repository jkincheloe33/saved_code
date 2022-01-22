export default async (req, res) => {
  const {
    body: { groups },
    clientAccount: { id: accountId },
  } = req

  try {
    const traitData = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT  T.id, T.name, COUNT(PT.peopleId) as peopleCount
        FROM traits T
        INNER JOIN peopleTraits PT on (T.id = PT.traitId)
        INNER JOIN peopleGroups PG on (PT.peopleId = PG.peopleId AND PG.groupId IN (?))
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId and TT.isReviewFilter = 1 AND TT.accountId = ?)
        GROUP BY (PT.traitId)
        ORDER BY T.name ASC
      `,
      params: [groups, accountId],
    })

    res.json({ success: true, traitData })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

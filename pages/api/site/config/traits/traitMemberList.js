export default async (req, res) => {
  const {
    body: { traitId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const traitMembers = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.firstName, P.lastName,
          PT.id AS peopleTraitId
        FROM peopleTraits PT
        INNER JOIN people P ON (PT.peopleId = P.id)
        INNER JOIN traits T ON (PT.traitId = T.id)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ${clientAccountId})
        WHERE T.id = ?
      `,
      params: [traitId],
    })

    res.json(traitMembers)
  } catch (error) {
    logServerError({ error, req })
    res.json([])
  }
}

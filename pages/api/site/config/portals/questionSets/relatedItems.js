export default async (req, res) => {
  try {
    const {
      body: { portalQuestionSetId },
      clientAccount: { id: clientAccountId },
    } = req

    const relatedTraits = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT PQST.id, PQST.traitId, T.name, TT.name AS traitTypeName
        FROM portalQuestionSetTraits PQST
        INNER JOIN portalQuestionSets PQS ON (PQS.id = PQST.portalQuestionSetId AND PQS.id = ?)
        INNER JOIN portals P ON (P.id = PQS.portalId AND P.accountId = ${clientAccountId})
        INNER JOIN traits T ON (T.id = PQST.traitId)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId)
        ORDER BY traitTypeName, T.name
      `,
      params: [portalQuestionSetId],
    })

    res.json({ success: true, relatedTraits })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

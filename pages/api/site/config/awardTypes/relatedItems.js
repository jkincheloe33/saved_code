export default async (req, res) => {
  try {
    const {
      body: { awardTypeId },
      clientAccount: { id: clientAccountId },
    } = req

    // Will return all related groups and awards to a given award type...KA
    const groupsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT ATG.id, ATG.groupId, G.name
        FROM awardTypeGroups ATG
        INNER JOIN awardTypes ATS ON (ATG.awardTypeId = ATS.id AND ATS.accountId = ?)
        INNER JOIN groups G ON (ATG.groupId = G.id)
        WHERE ATG.awardTypeId = ?
        ORDER BY G.name
      `,
      params: [clientAccountId, awardTypeId],
    })

    const traitsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT ATT.id, ATT.traitId, T.name, TT.name AS traitTypeName
        FROM awardTypeTraits ATT
        INNER JOIN awardTypes ATS ON (ATT.awardTypeId = ATS.id AND ATS.accountId = ?)
        INNER JOIN traits T ON (T.id = ATT.traitId)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId)
        WHERE ATT.awardTypeId = ?
        ORDER BY traitTypeName, T.name
      `,
      params: [clientAccountId, awardTypeId],
    })

    const [relatedGroups, relatedTraits] = await Promise.all([groupsQuery, traitsQuery])
    res.json({ success: true, relatedGroups, relatedTraits })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

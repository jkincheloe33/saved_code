export default async (req, res) => {
  try {
    const {
      body: { challengeId },
      clientAccount: { id: clientAccountId },
    } = req

    // Will return all related groups and traits to a given challenge...KA
    const groupsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT CG.id, CG.groupId, G.name
        FROM challengeGroups CG
        INNER JOIN challenges C ON (CG.challengeId = C.id)
        INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id AND CT.accountId = ?)
        INNER JOIN groups G ON (CG.groupId = G.id)
        WHERE CG.challengeId = ?
        ORDER BY G.name
      `,
      params: [clientAccountId, challengeId],
    })

    const traitsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT CT.id, CT.traitId, T.name, TT.name AS traitTypeName
        FROM challengeTraits CT
        INNER JOIN challenges C ON (CT.challengeId = C.id)
        INNER JOIN challengeThemes CTS ON (C.challengeThemeId = CTS.id AND CTS.accountId = ?)
        INNER JOIN traits T ON (T.id = CT.traitId)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId)
        WHERE CT.challengeId = ?
        ORDER BY traitTypeName, T.name
      `,
      params: [clientAccountId, challengeId],
    })

    const goalsQuery = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT CG.*
        FROM challengeGoals CG
        INNER JOIN challenges C ON (C.id = CG.challengeId AND C.id = ?)
        INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id AND CT.accountId = ?)
        ORDER BY CG.id
      `,
      params: [challengeId, clientAccountId],
    })

    //Set trigger condition as JSON format or keep as null...CY
    goalsQuery.forEach(g => (g.triggerCondition = g.triggerCondition ? JSON.stringify(g.triggerCondition) : g.triggerCondition))

    const [relatedGroups, relatedTraits, relatedGoals] = await Promise.all([groupsQuery, traitsQuery, goalsQuery])

    res.json({ success: true, relatedGroups, relatedTraits, relatedGoals })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

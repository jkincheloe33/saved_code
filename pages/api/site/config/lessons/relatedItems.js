export default async (req, res) => {
  try {
    const {
      body: { lessonId },
      clientAccount: { id: clientAccountId },
    } = req

    const groupsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT LG.id, LG.groupId, G.name
        FROM lessonGroups LG
        INNER JOIN lessons L ON (LG.lessonId = L.id AND L.accountId = ? AND L.id = ?)
        INNER JOIN groups G ON (LG.groupId = G.id)
        ORDER BY G.name
      `,
      params: [clientAccountId, lessonId],
    })

    const traitsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT LT.id, LT.traitId, T.name, TT.name AS traitTypeName
        FROM lessonTraits LT
        INNER JOIN lessons L ON (L.id = LT.lessonId AND L.accountId = ? AND L.id = ?)
        INNER JOIN traits T ON (T.id = LT.traitId)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId)
        ORDER BY traitTypeName, T.name
      `,
      params: [clientAccountId, lessonId],
    })

    const [relatedGroups, relatedTraits] = await Promise.all([groupsQuery, traitsQuery])

    res.json({ success: true, relatedGroups, relatedTraits })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

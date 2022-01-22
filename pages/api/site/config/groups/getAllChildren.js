const limit = 50

export default async (req, res) => {
  const {
    body: { parentIds, search = '' },
    clientAccount,
  } = req

  try {
    const term = wambiDB.escapeValue(`%${search.trim()}%`)

    const childGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, G.name
        FROM groupIndex GI
        INNER JOIN groups G ON (G.id = GI.fromGroupId AND G.accountId = ${clientAccount.id})
        WHERE G.name LIKE ${term}
          ${parentIds?.length ? 'AND GI.groupId IN (?)' : ''}
        GROUP BY G.id
        LIMIT ${limit}
      `,
      params: [parentIds],
    })

    res.json({ success: true, childGroups })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

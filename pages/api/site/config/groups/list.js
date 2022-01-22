// This endpoint is used for listing/selecting (possibly searching) for groups...EK

// Modal freaks out so limiting for now instead of infinitely loading, since you can search...KA
const limit = 50

export default async (req, res) => {
  const {
    body: { search = '' },
    clientAccount,
  } = req

  try {
    const term = wambiDB.escapeValue(`%${search.trim()}%`)

    // Temp fix for the Show Chart button in Groups Editor...KA
    const limitIfSearchExists = req.body.search != null ? `LIMIT ${limit}` : ''

    const groupsForAccount = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, G.groupTypeId, G.parentGroupId, G.name, G.depth,
          GT.name AS groupTypeName
        FROM groups G
        INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id)
        WHERE G.accountId = ${clientAccount.id}
          AND (
            G.name LIKE ${term}
            OR GT.name LIKE ${term}
          )
        ORDER BY G.depth, G.name ASC
        ${limitIfSearchExists}
      `,
    })

    res.json({ success: true, groupsForAccount })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

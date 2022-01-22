export default async (req, res) => {
  const {
    body: { itemType },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const draftsList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT id, scheduledAt, status, editedAt, createdAt, draftData
        FROM feedItemDrafts
        WHERE accountId = ${clientAccountId}
          AND authorId = ${userId}
          AND itemType = ?
        ORDER BY scheduledAt ASC, editedAt DESC
      `,
      params: [itemType],
    })

    res.json({ success: true, draftsList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

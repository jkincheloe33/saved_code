export default async (req, res) => {
  const {
    body: { content, feedId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  const updateSharedWambi = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE feedItems
      SET content = ?, editedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND accountId = ${clientAccountId}
        AND authorId = ${userId}
    `,
    params: [content, feedId],
  })

  res.json({ success: updateSharedWambi.changedRows === 1, feedId })
}

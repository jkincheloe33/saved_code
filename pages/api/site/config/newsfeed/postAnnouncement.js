const { FEED_ITEM_TYPES } = require('@utils/types')

export default async (req, res) => {
  const {
    body: { content, groupIds },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req
  const transaction = await wambiDB.beginTransaction()

  try {
    const insertRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO feedItems
        SET ?
      `,
      params: [
        {
          content,
          accountId: clientAccountId,
          itemType: FEED_ITEM_TYPES.ANNOUNCEMENT,
          authorId: userId,
        },
      ],
    })

    let newFeedId = insertRes.insertId

    // Link to groups and people...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO feedGroups (feedId, groupId)
        VALUES ?
      `,
      params: [groupIds.map(g => [newFeedId, g])],
    })

    await wambiDB.commitTransaction(transaction)

    res.json({ success: true, newId: insertRes.newFeedId })
  } catch (error) {
    logServerError({ error, req })
    await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error occurred; Check server logs' })
  }
}

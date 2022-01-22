module.exports = {
  deleteFeedItemDraft: async ({ feedItemDraftId, hasMedia, newFeedItemId, req, transaction = null }) => {
    let isLocalTransaction = true

    try {
      if (transaction) {
        isLocalTransaction = false
      } else {
        transaction = await wambiDB.beginTransaction()
      }

      if (hasMedia) {
        if (newFeedItemId) {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              UPDATE mediaLink
              SET tableName = 'feedItems',
                tableKey = ?
              WHERE tableName = 'feedItemDrafts'
                AND tableKey = ?
            `,
            params: [newFeedItemId, feedItemDraftId],
          })
        } else {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              DELETE
              FROM mediaLink
              WHERE tableName = 'feedItemDrafts'
                AND tableKey = ?
            `,
            params: [feedItemDraftId],
          })
        }
      }

      const deleteRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          DELETE
          FROM feedItemDrafts
          WHERE id = ?
        `,
        params: [feedItemDraftId],
      })

      if (isLocalTransaction) {
        await wambiDB.commitTransaction(transaction)
      }
      return { success: deleteRes.affectedRows === 1 }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of deleteFeedItemDraft', error, req })
      if (isLocalTransaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}

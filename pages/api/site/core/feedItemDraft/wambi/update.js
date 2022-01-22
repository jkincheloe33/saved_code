import { FEED_ITEM_TYPES } from '@utils/types'

export default async (req, res) => {
  const {
    body: { cpcData, feedItemDraftId, scheduledAt, status },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const updatedDraft = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE feedItemDrafts
        SET ?, editedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND accountId = ${clientAccountId}
          AND authorId = ${userId}
      `,
      params: [
        {
          accountId: clientAccountId,
          authorId: userId,
          draftData: JSON.stringify(cpcData),
          itemType: FEED_ITEM_TYPES.CPC,
          scheduledAt: scheduledAt ?? null,
          status,
        },
        feedItemDraftId,
      ],
    })

    res.json({ success: updatedDraft.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

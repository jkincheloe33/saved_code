import { FEED_ITEM_TYPES } from '@utils'

export default async (req, res) => {
  const {
    body: { cpcData, scheduledAt, status },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO feedItemDrafts
        SET ?
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
      ],
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

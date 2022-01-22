import { FEED_ITEM_TYPES } from '@utils'

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const count = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT COUNT(id) AS draftCount, itemType
        FROM feedItemDrafts
        WHERE accountId = ${clientAccountId}
          AND authorId = ${userId}
        GROUP BY itemType
      `,
    })

    // separates out post and cpc counts by itemType...JK
    const posts = count.find(c => c.itemType === FEED_ITEM_TYPES.ANNOUNCEMENT)
    const cpcs = count.find(c => c.itemType === FEED_ITEM_TYPES.CPC)

    res.json({ success: true, cpcs, posts })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

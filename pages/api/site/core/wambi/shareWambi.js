import { handleChallenges } from '@serverHelpers/challenges/handleChallenges'
import { getManagingGroups } from '@serverHelpers/getManagingGroups'

import { FEED_ITEM_TYPES, FEED_ITEM_STATUS, TRIGGERS } from '@utils/types'

export default async (req, res) => {
  const {
    body: { linkedFeedId, content },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  let transaction
  try {
    const groups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT PG.groupId AS id
        FROM peopleGroups PG
        INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
        WHERE PG.peopleId = ${userId}
      `,
    })
    const feedGroupsList = await getManagingGroups({ groups })

    transaction = await wambiDB.beginTransaction()

    const feedRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO feedItems
        SET ?
      `,
      params: [
        {
          accountId: clientAccountId,
          authorId: userId,
          content,
          itemType: FEED_ITEM_TYPES.SHARED_WAMBI,
          linkedFeedId,
          status: FEED_ITEM_STATUS.VISIBLE,
        },
      ],
    })

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO feedGroups (feedId, groupId, isManaging)
        VALUES ?
      `,
      params: [feedGroupsList.map(({ id, isManaging }) => [feedRes.insertId, id, isManaging])],
    })

    await wambiDB.commitTransaction(transaction)

    const { completedChallenges, rewardProgress } = await handleChallenges({
      clientAccountId,
      req,
      triggers: [TRIGGERS.CPC_SHARE],
      userId,
    })

    res.json({ success: true, completedChallenges, feedId: feedRes.insertId, rewardProgress })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

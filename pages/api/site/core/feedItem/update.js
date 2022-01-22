const { CPC_STATUS: cpcStatus, FEED_ITEM_STATUS: feedItemStatus, GROUP_ACCESS_LEVELS } = require('@utils/types')
const deleteNotification = require('@serverHelpers/notifications/delete')

export default async (req, res) => {
  let {
    body: { cpcId, feedId, ...updated },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  let transaction
  try {
    let managingGroupIds = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT FG.groupId
        FROM feedGroups FG
        WHERE FG.feedId = ? 
          AND FG.isManaging = 1
        ORDER BY id DESC
      `,
      params: [feedId],
    })

    let userRealmGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT G.id
        FROM peopleGroups PG
        INNER JOIN groupIndex GI ON (PG.groupId = GI.groupId AND PG.peopleId = ${userId} AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
        INNER JOIN groups G ON (GI.fromGroupId = G.id AND G.accountId = ${clientAccountId})
      `,
    })

    managingGroupIds = managingGroupIds.map(g => g.groupId)
    const userManagesFeedItem = userRealmGroups.some(rg => managingGroupIds.includes(rg.id))

    if (userManagesFeedItem) {
      transaction = await wambiDB.beginTransaction()

      let updatedCpc = null
      const updatedFeedItem = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE feedItems
          SET ?
          WHERE id = ?
        `,
        params: [addUpdates(updated), feedId],
      })

      if (cpcId != null) {
        let cpcUpdates = updated
        if (updated.status != null) {
          cpcUpdates.status = updated.status === feedItemStatus.HIDDEN ? cpcStatus.HIDDEN : cpcStatus.APPROVED
        }

        updatedCpc = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE cpc
            SET ?
            WHERE id = ?
          `,
          params: [addUpdates(cpcUpdates), cpcId],
        })
      }

      await wambiDB.commitTransaction(transaction)

      // Cascade delete feedItem notifications...CY
      if (updated && updated.status === feedItemStatus.HIDDEN) {
        deleteNotification({ id: feedId, accountId: clientAccountId, tableName: 'feedItems' })
      }
      res.json({
        success: cpcId != null ? updatedCpc.changedRows === 1 && updatedFeedItem.changedRows === 1 : updatedFeedItem.changedRows === 1,
      })
    } else {
      res.json({ success: false, msg: 'User does not have access to update this feed item' })
    }
  } catch (error) {
    await wambiDB.rollbackTransaction(transaction)
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to update feed item' })
  }
}

//Add update key here...CY
const allowEdit = ['status']
function addUpdates(updated) {
  let validUpdate = {}
  for (let p in updated) {
    if (allowEdit.indexOf(p) > -1) {
      validUpdate[`${p}`] = updated[p]
    }
  }

  return validUpdate
}

module.exports = async ({ clientAccountId, movingGroup, newParentGroup, req, transaction }) => {
  const localTransaction = transaction == null

  try {
    const validClientAccountGroups = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(id) = 2
        FROM groups
        WHERE id IN (?)
          AND accountId = ${clientAccountId}
      `,
      params: [[movingGroup.id, newParentGroup.id]],
    })

    if (!validClientAccountGroups) return { success: false, msg: 'Groups are not in a valid client account' }

    const isGroupMovingBelowItself = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM groupIndex
        WHERE groupId = ?
          AND fromGroupId = ?
      `,
      params: [movingGroup.id, newParentGroup.id],
    })

    if (isGroupMovingBelowItself) return { success: false, msg: 'Group cannot move below itself' }

    // Check if moving group and its realm have managing groups that new parent group or it's parents have for same feed item...JC
    const matchingFeedManagingGroupsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT FG.id
        FROM feedGroups FG
        INNER JOIN feedGroups PFG ON (PFG.isManaging = 1 AND PFG.feedId = FG.feedId AND PFG.groupId IN (
          -- Get all parents of the new parent group
            SELECT groupId
            FROM groupIndex
            WHERE fromGroupId = ?
          )
        )
        WHERE FG.groupId IN (
          -- Get the realm of the moving group
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
        ) AND FG.isManaging = 1
      `,
      params: [newParentGroup.id, movingGroup.id],
    })

    // Get the indexes that are affected by the move - pull now, del later...JC
    const indexesAffectedByMoveToDeleteQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT id
        FROM groupIndex
        WHERE fromGroupId IN (
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
        )
        ORDER BY fromGroupId, depth ASC
      `,
      params: [movingGroup.id],
    })

    // Group indexes that are used to update the affected group indexes (includes new parent group)..EK
    const newParentGroupIndexesQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT groupId, depth
        FROM groupIndex
        WHERE fromGroupId IN (
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
        ) AND depth <= ?
        ORDER BY depth ASC
      `,
      params: [newParentGroup.id, newParentGroup.depth],
    })

    // The affected group indexes that can be reused under the group being moved...JC
    const affectedMovingGroupIndexesQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT groupId, depth, fromGroupId
        FROM groupIndex
        WHERE fromGroupId IN (
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
        ) AND depth >= ?
        ORDER By fromGroupId, depth ASC
      `,
      params: [movingGroup.id, movingGroup.depth],
    })

    // Calculate depth delta..EK
    const depthDeltaQuery = wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT PG.depth + 1 - MG.depth AS depthDelta
        FROM groups MG
        INNER JOIN groups PG ON (PG.id = ?)
        WHERE MG.id = ?
      `,
      params: [newParentGroup.id, movingGroup.id],
    })

    const [
      matchingFeedManagingGroups,
      indexesAffectedByMoveToDelete,
      newParentGroupIndexes,
      affectedMovingGroupIndexes,
      { depthDelta },
    ] = await Promise.all([
      matchingFeedManagingGroupsQuery,
      indexesAffectedByMoveToDeleteQuery,
      newParentGroupIndexesQuery,
      affectedMovingGroupIndexesQuery,
      depthDeltaQuery,
    ])

    const newMovingGroupIndexes = []
    let rootGroupsParentList = []
    // Add the newParentIndexes on top of all affected groups to rebuild the moving groups groupIndex insert...JC
    affectedMovingGroupIndexes.forEach(g => {
      g.depth += depthDelta

      if (g.groupId === g.fromGroupId) {
        newMovingGroupIndexes.push(...newParentGroupIndexes.map(pg => ({ ...pg, fromGroupId: g.fromGroupId })), ...rootGroupsParentList, g)
        rootGroupsParentList = []
      } else rootGroupsParentList.push(g)
    })

    transaction = localTransaction ? await wambiDB.beginTransaction() : transaction

    // Update moving groups parent group and depth...JC
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE groups
        SET
          parentGroupId = ?,
          depth = depth + ${depthDelta}
        WHERE id = ?
      `,
      params: [newParentGroup.id, movingGroup.id],
    })

    // Update moving groups realm, only depth since their parents stay the same...JC
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE groups
        SET
          depth = depth + ${depthDelta}
        WHERE id IN (
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
            AND fromGroupId <> ?
        )
      `,
      params: [movingGroup.id, movingGroup.id],
    })

    // Delete old group indexes, rebuild new ones...JC
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        DELETE FROM groupIndex
        WHERE id IN (?)
      `,
      params: [indexesAffectedByMoveToDelete.map(g => g.id)],
    })

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO groupIndex (groupId, depth, fromGroupId)
        VALUES ?
      `,
      params: [newMovingGroupIndexes.map(g => [g.groupId, g.depth, g.fromGroupId])],
    })

    if (matchingFeedManagingGroups.length) {
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE feedGroups
          SET isManaging = 0
          WHERE id IN (?)
        `,
        params: [matchingFeedManagingGroups.map(fg => fg.id)],
      })
    }

    if (localTransaction) await wambiDB.commitTransaction(transaction)
    return { newDepth: (movingGroup.depth += depthDelta), success: true }
  } catch (error) {
    if (localTransaction) await wambiDB.rollbackTransaction(transaction)
    logServerError({ additionalInfo: 'Error inside of moveGroup', error, req })
    return { msg: 'Error moving group', success: false }
  }
}

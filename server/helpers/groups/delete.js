import moveGroup from '@serverHelpers/groups/move'

const _moveDeletingGroupContent = async ({ deletingGroupId, delTargetGroupId, transaction }) => {
  // Table foreign key reference to group. Add and remove table references on table updates...CY
  const moveContentTables = [
    { table: 'peopleGroups', foreignKey: 'peopleId' },
    { table: 'challengeGroups', foreignKey: 'challengeId' },
    { table: 'feedGroups', foreignKey: 'feedId' },
    { table: 'portalQuestionSetGroups', foreignKey: 'portalQuestionSetId' },
    { table: 'portalGroups', foreignKey: 'portalId' },
    { table: 'awardTypeGroups', foreignKey: 'awardTypeId' },
    { table: 'lessonGroups', foreignKey: 'lessonId' },
    { table: 'rewardGiftGroups', foreignKey: 'rewardGiftId' },
  ]

  for (let i = 0; i < moveContentTables.length; i++) {
    const { table, foreignKey } = moveContentTables[i]
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE ${table}
        SET groupId = ?
        WHERE groupId = ?
          -- Check if newParentGroup data already exist to not add dups...CY
          AND ${foreignKey} NOT IN (
            SELECT * FROM (
              SELECT ${foreignKey}
              FROM ${table}
              WHERE groupId = ?)
            AS G);

        -- Delete any data referencing the deleting group that remains...CY
        DELETE FROM ${table}
        WHERE groupId = ?;
      `,
      params: [delTargetGroupId, deletingGroupId, delTargetGroupId, deletingGroupId],
    })
  }

  await wambiDB.executeNonQuery({
    transaction,
    commandText: /*sql*/ `
      UPDATE surveys
      SET groupId = ?
      WHERE groupId = ?
    `,
    params: [delTargetGroupId, deletingGroupId],
  })
}

module.exports = async ({ clientAccountId, deletingGroup, delTargetGroup, req, transaction }) => {
  const localTransaction = transaction == null

  try {
    const validClientAccountGroups = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(id) = 2
        FROM groups
        WHERE id IN (?)
          AND accountId = ${clientAccountId}
      `,
      params: [[deletingGroup.id, delTargetGroup.id]],
    })

    if (!validClientAccountGroups) return { success: false, msg: 'Groups are not in the same client account' }

    const isGroupDeletingBelowItself = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM groupIndex
        WHERE groupId = ?
          AND fromGroupId = ?
      `,
      params: [deletingGroup.id, delTargetGroup.id],
    })

    if (isGroupDeletingBelowItself) return { success: false, msg: 'Deleting group contents must move to a group next to it' }

    const targetGroupAdjacent = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM groups G
        -- Check if target group is adjacent to deleting group (has the same parent or both are at top level)...JC
        INNER JOIN groups DG ON (
          G.id <> ?
            AND DG.id = ?
            AND IF(G.parentGroupId IS NOT NULL,
              (DG.parentGroupId = G.parentGroupId),
              (DG.depth = G.depth)
            )
          )
        WHERE G.accountId = ${clientAccountId}
          AND G.id = ?
      `,
      params: [deletingGroup.id, deletingGroup.id, delTargetGroup.id],
    })

    // Move del group to del target groups parent to make it adjacent to target group...JC
    if (!targetGroupAdjacent) {
      if (!delTargetGroup.parentGroupId) return { msg: 'Group cannot be deleted into a root level group', success: false }

      const delTargetGroupParent = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT *
          FROM groups
          WHERE id = ?
        `,
        params: [delTargetGroup.parentGroupId],
      })

      const { msg, newDepth, success } = await moveGroup({
        clientAccountId,
        movingGroup: deletingGroup,
        newParentGroup: delTargetGroupParent,
        req,
      })

      if (!success) return { msg, success }
      else deletingGroup = { ...deletingGroup, depth: newDepth }
    }

    // Check if deleting group and its realm have managing groups that new parent group has...JC
    const matchingFeedManagingGroupsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT FG.id, FG.groupId
        FROM feedGroups FG
        INNER JOIN feedGroups PFG ON (PFG.isManaging = 1 AND PFG.feedId = FG.feedId AND PFG.groupId = ?)
        WHERE FG.groupId IN (
          -- Get the realm of the deleting group
          SELECT fromGroupId
          FROM groupIndex
          WHERE groupId = ?
        ) AND FG.isManaging = 1
      `,
      params: [delTargetGroup.id, deletingGroup.id],
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
      params: [deletingGroup.id],
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
      params: [delTargetGroup.id, delTargetGroup.depth],
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
        AND groupId <> ?
        ORDER By fromGroupId, depth ASC
      `,
      params: [deletingGroup.id, deletingGroup.depth, deletingGroup.id],
    })

    // Calculate depth delta..EK
    const depthDeltaQuery = wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT PG.depth - MG.depth AS depthDelta
        FROM groups MG
        INNER JOIN groups PG ON (PG.id = ?)
        WHERE MG.id = ?
      `,
      params: [delTargetGroup.id, deletingGroup.id],
    })

    const directChildrenOfDeletingGroupQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT id
        FROM groups
        WHERE parentGroupId = ?
      `,
      params: [deletingGroup.id],
    })

    const [
      matchingFeedManagingGroups,
      indexesAffectedByMoveToDelete,
      newParentGroupIndexes,
      affectedMovingGroupIndexes,
      { depthDelta },
      directChildrenOfDeletingGroup,
    ] = await Promise.all([
      matchingFeedManagingGroupsQuery,
      indexesAffectedByMoveToDeleteQuery,
      newParentGroupIndexesQuery,
      affectedMovingGroupIndexesQuery,
      depthDeltaQuery,
      directChildrenOfDeletingGroupQuery,
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

    if (localTransaction) transaction = await wambiDB.beginTransaction()

    const deletedGroupDirectChildrenIds = directChildrenOfDeletingGroup.map(({ id }) => id)

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        DELETE FROM groupIndex
        WHERE id IN (?)
      `,
      params: [indexesAffectedByMoveToDelete.map(g => g.id)],
    })

    if (deletedGroupDirectChildrenIds.length) {
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO groupIndex (groupId, depth, fromGroupId)
          VALUES ?
        `,
        params: [newMovingGroupIndexes.map(g => [g.groupId, g.depth, g.fromGroupId])],
      })

      // Update the deleting group direct children parentId and depth...CY
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE groups
          SET
            parentGroupId = ?,
            depth = depth + ${depthDelta}
          WHERE id IN (${deletedGroupDirectChildrenIds})
        `,
        params: [delTargetGroup.id],
      })

      // Update all the deleting group direct children realm depth...CY
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE groups
          SET depth = depth + ${depthDelta}
          WHERE id IN (
            SELECT fromGroupId
            FROM groupIndex
            WHERE groupId IN (${deletedGroupDirectChildrenIds})
              AND fromGroupId NOT IN (${deletedGroupDirectChildrenIds})
          )
        `,
      })
    }

    if (matchingFeedManagingGroups.length) {
      // Redundant managing groups for the deleting group that are the same as new parent group...CY/JC
      const deletingGroupFeeds = matchingFeedManagingGroups.filter(g => g.groupId === deletingGroup.id).map(({ id }) => id)

      // Deleting groups realm just gets set to non-managing...CY/JC
      const realmFeedsToUpdate = matchingFeedManagingGroups.filter(g => g.groupId !== deletingGroup.id).map(({ id }) => id)

      if (deletingGroupFeeds.length) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            DELETE FROM feedGroups
            WHERE id IN (${deletingGroupFeeds})
          `,
        })
      }

      if (realmFeedsToUpdate.length) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE feedGroups
            SET isManaging = 0
            WHERE id IN (${realmFeedsToUpdate})
          `,
        })
      }
    }

    await _moveDeletingGroupContent({ deletingGroupId: deletingGroup.id, delTargetGroupId: delTargetGroup.id, transaction })

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        DELETE FROM groups
        WHERE id = ?
      `,
      params: [deletingGroup.id],
    })

    if (localTransaction) await wambiDB.commitTransaction(transaction)
    return { success: true }
  } catch (error) {
    logServerError({ additionalInfo: 'Error inside of deleteGroup', error, req })
    if (localTransaction && transaction) await wambiDB.rollbackTransaction(transaction)
    return { msg: 'Error deleting group', success: false }
  }
}

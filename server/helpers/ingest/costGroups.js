const generateCostGroupClientIds = async ({ clientAccountId, ingestionTableName, logger }, clientIdFormula) => {
  // Generate a "clientId" that maps to the groups client Id (this may be different by account)
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE ${ingestionTableName} DFI
      SET DFI.groups_clientId = ${clientIdFormula}
      ;
    `,
  })

  // Using the above generated import client id, map a group id where the client Ids match import and the groups
  const matchedPeopleGroups = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE ${ingestionTableName} DFI
      INNER JOIN groups G ON (G.accountId = ${clientAccountId} AND G.clientId = DFI.groups_clientId)
      SET DFI.groups_id = G.id
      WHERE DFI.groups_id IS NULL
      ;
    `,
  })

  await logger.logInfo(`Matched People Groups (cost centers): ${matchedPeopleGroups.changedRows}`)
}

const associatePeopleWithCostGroups = async ({ ingestionTableName, logger }, groupLevelFormula = '1') => {
  let transaction = null

  try {
    await logger.logInfo('Handling cost-center group associations...')

    // Now that we have groupId linked in the import table, compare the differences and apply them...EK
    // NOTE: This is all done under a transaction because of the temporary table used...EK
    transaction = await wambiDB.beginTransaction()

    // This calculates the differences in the group import and tracks if links may already exist and just need to become primary...EK
    const [, groupLinkUpdates] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DROP TEMPORARY TABLE IF EXISTS groupLinkUpdates;
  
        CREATE TEMPORARY TABLE groupLinkUpdates AS
          SELECT DFI.peopleId,
            OG.id AS oldGroupId,
            IF(OGE.id IS NULL, 0, 1) AS oldGroupLinkExists,
            NG.id as newGroupId,
            IF(NGE.id IS NULL, 0, 1) AS newGroupLinkExists,
            ${groupLevelFormula} AS groupLevel
          FROM ${ingestionTableName} DFI
          LEFT JOIN peopleGroups PG ON (PG.peopleId = DFI.peopleId AND PG.isPrimary = 1)
          LEFT JOIN groups OG ON (PG.groupId = OG.id)
          LEFT JOIN groups NG ON (DFI.groups_id = NG.id)
          LEFT JOIN peopleGroups NGE ON (PG.peopleId = NGE.peopleId AND NG.id = NGE.groupId)
          LEFT JOIN peopleGroups OGE ON (PG.peopleId = OGE.peopleId AND OG.id = OGE.groupId)
          WHERE IFNULL(PG.groupId, 0) <> DFI.groups_id
          ORDER BY PG.peopleId ASC
        ;
      `,
      transaction,
    })

    await logger.logInfo(`Found ${groupLinkUpdates.affectedRows} group (new, move, update) updates...`)

    // Set existing links to be primary (if they are going to become the new group)
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN groupLinkUpdates U ON (
          PG.peopleId = U.peopleId
          AND PG.groupId = U.newGroupId
          AND IFNULL(PG.isPrimary, 0) = 0
          AND U.newGroupLinkExists = 1
        )
        SET
          PG.isPrimary = 1,
          PG.level = U.groupLevel
        ;
      `,
      transaction,
    })

    // Set existing primary links not new to not be primary (if any)
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN groupLinkUpdates U ON (
          PG.peopleId = U.peopleId
          AND PG.groupId = U.oldGroupId
          AND PG.isPrimary = 1
          AND U.newGroupLinkExists = 1
        )
        SET PG.isPrimary = 0
        -- NOTE: leave the old group level alone...EK
        ;
      `,
      transaction,
    })

    // Update old existing primary links to the new primary group links
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN groupLinkUpdates U ON (
          PG.peopleId = U.peopleId
          AND PG.groupId = U.oldGroupId
          AND PG.isPrimary = 1
          AND U.newGroupLinkExists = 0
        )
        SET
          PG.groupId = U.newGroupId,
          PG.level = U.groupLevel
        ;
      `,
      transaction,
    })

    // Handle if old group exists but is not primary (so insert below would cause duplicate and fail to run)...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN groupLinkUpdates U ON (
          PG.peopleId = U.peopleId
          AND PG.groupId = U.newGroupId
          AND U.oldGroupLinkExists = 0
          -- NOTE: Removed the isPrimary check to just see if the old group exists and is not primary
        )
        SET
          PG.isPrimary = 1,
          PG.level = U.groupLevel
      `,
      transaction,
    })

    // Insert where the old group link does not exist (meaning they have no link that matches and non that are primary)
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO peopleGroups (peopleId, groupId, level, isPrimary)
          SELECT U.peopleId, U.newGroupId, U.groupLevel, 1
          FROM groupLinkUpdates U
          -- ENSURE the newGroupId doesn't already exist for the user (see above query for how this can happen)
          LEFT JOIN peopleGroups PG ON (PG.peopleId = U.peopleId AND PG.groupId = U.newGroupId)
          WHERE U.oldGroupLinkExists = 0
            AND PG.id IS NULL   -- The newGroupId doesn't already exist for the user (can happen if was assigned manually)
        ;
      `,
      transaction,
    })

    // Now that we are all aligned... update all group levels (for any updates outside of new links above)...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN ${ingestionTableName} DFI ON (PG.peopleId = DFI.peopleId AND PG.groupId = DFI.groups_id)
        SET PG.level = ${groupLevelFormula}
        WHERE PG.level <> ${groupLevelFormula}
      `,
      transaction,
    })

    // TODO: Need to update existing group links levels are out of sync (by level of membership)
    await wambiDB.commitTransaction(transaction)

    // Generate an exception report for missing or unlinked groups...EK
    const groupExceptions = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT groups_site, groups_deptId, groups_deptName, groups_clientId, COUNT(DFI.groups_deptId) AS peopleAffected
        FROM ${ingestionTableName} DFI
        WHERE DFI.groups_id IS NULL
        GROUP BY groups_site, groups_deptId, groups_deptName, groups_clientId
        ORDER BY peopleAffected DESC
      `,
    })

    if (groupExceptions.length > 0) {
      await logger.logWarning(`Ingestion found ${groupExceptions.length} group exceptions.`)

      await logger.bulkLog(
        groupExceptions.map(e => {
          return {
            type: logger.LOG_TYPES.EXCEPTION,
            message: 'Group Exception',
            data: e,
          }
        })
      )
    }

    await logger.logInfo('Finished Handling cost-center group associations...')
  } catch (error) {
    if (transaction) wambiDB.rollbackTransaction(transaction)
    throw error
  }
}

module.exports = {
  generateCostGroupClientIds,
  associatePeopleWithCostGroups,
}

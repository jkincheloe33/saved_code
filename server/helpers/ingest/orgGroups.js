import moveGroup from '@serverHelpers/groups/move'
import deleteGroup from '@serverHelpers/groups/delete'

const handleOrganizationGroups = async (
  { clientAccountId, ingestionTableName, httpReq, logger },
  { rootLeaderHrId = '', orgGroupTypeId = 0, groupNameFormula = 'CONCAT(DO.fullName, "\'s Group")' } = {}
) => {
  const rootLeader = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT P.id
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
      WHERE P.hrId = ${rootLeaderHrId}
      ;
    `,
  })

  if (rootLeader == null) {
    return await logger.logWarning(`WARNING: ORG HIERARCHY - Root leader id not valid: ${rootLeaderHrId} ... Skipping.`)
  }

  const orgGroupType = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT GT.id
      FROM groupTypes GT
      WHERE GT.accountId = ${clientAccountId}
        AND GT.id = ${orgGroupTypeId}
      ;
    `,
  })

  if (orgGroupType == null) {
    return await logger.logWarning(`WARNING: ORG HIERARCHY - Org group type id not valid: ${orgGroupTypeId} ... Skipping.`)
  }

  const rootGroup = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT G.id, G.depth
      FROM groups G
      WHERE G.accountId = ${clientAccountId}
        AND G.clientId = ${rootLeaderHrId}    -- The root group's Client ID must match the top level leader HR ID...EK
      ;
    `,
  })

  if (rootGroup == null) {
    return await logger.logWarning(`WARNING: ORG HIERARCHY - Root group id not valid (looking for: ${rootLeaderHrId}) ... Skipping.`)
  }

  // TESTING
  console.log('rootLeader', rootLeader)
  console.log('orgGroupType', orgGroupType)
  console.log('rootGroup', rootGroup)

  // -- ================================================================================================================
  // -- 1 - We need to create groups for owners that are missing (this must be done top level down)
  // -- ================================================================================================================

  // Reserve the connection for this loop...EK
  const transaction = await wambiDB.beginTransaction()

  // To allow for auto commits below and to hold the connection, we are going to close the commit, but keep the transaction "connection" available...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      COMMIT;   -- No op to allow auto-commit to take over (we don't need rollback support, just a reserved connection)...EK
    `,
    transaction,
  })

  // Init the connection...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SET @clientAccountId = ${clientAccountId}
      ;
      SET @rootLeaderId = ${rootLeader.id}
      ;
      SET @orgGroupTypeId = ${orgGroupType.id}
      ;
      SET @rootGroupId = ${rootGroup.id}
      ;

      DROP TEMPORARY TABLE IF EXISTS depthIds;
      CREATE TEMPORARY TABLE depthIds AS
        SELECT @rootLeaderId AS id
      ;

      ALTER TABLE depthIds ADD INDEX id (id)
      ;
    `,
    transaction,
  })

  let depthCounter = rootGroup.depth + 1
  let groupsAffected = 1 // Default to 1 to allow the while to at least loop once...EK

  while (groupsAffected > 0) {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `

        SET @depth = ${depthCounter}
        ;

        -- Calculate people who report above and also have people who report to them...EK
        DROP TEMPORARY TABLE IF EXISTS depthOwners;
        CREATE TEMPORARY TABLE depthOwners AS
          SELECT P.id AS peopleId, P.hrId, CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) AS fullName,
            PS.hrId AS supervisorHrId, G.id AS groupId, 0 AS newGroupId, COUNT(PR.id) AS myReportsCount
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = @clientAccountId)
          INNER JOIN people PS ON (PS.id = P.reportsTo)
          INNER JOIN people PR ON (PR.reportsTo = P.id)    
          LEFT JOIN groups G ON (
            G.accountId = @clientAccountId
              AND G.groupTypeId = @orgGroupTypeId
              AND G.clientId = P.hrId
          )
          WHERE P.reportsTo IN (SELECT id from depthIds)
            AND P.reportsTo <> P.id
          GROUP BY P.id
        ;

        -- INSERT any new groups at this depth
        INSERT INTO groups (accountId, groupTypeId, parentGroupId, name, depth, runtimeSettings, clientId)
          SELECT @clientAccountId, @orgGroupTypeId, parentG.id, ${groupNameFormula}, @depth, '{}', DO.hrId
          FROM depthOwners DO
          INNER JOIN groups parentG ON (
            parentG.accountId = @clientAccountId
              AND (parentG.id = @rootGroupId OR parentG.groupTypeId = @orgGroupTypeId)
              AND parentG.clientId = DO.supervisorHrId
          )
          WHERE DO.groupId IS NULL -- This group does not already exist
        ;

        -- Store the new group Ids (IF any)
        UPDATE depthOwners DO
        INNER JOIN groups G ON (
          G.accountId = @clientAccountId
            AND G.groupTypeId = @orgGroupTypeId
            AND G.clientId = DO.hrId
            AND DO.groupId IS NULL
        )
        SET DO.newGroupId = G.id
        ;

        DROP TEMPORARY TABLE IF EXISTS depthOwners2;
        CREATE TEMPORARY TABLE depthOwners2 AS
          SELECT * FROM depthOwners
        ;

        -- Generate new group indexes at this level...EK
        INSERT INTO groupIndex (groupId, depth, fromGroupId)
          SELECT GI.groupId, GI.depth, DO.newGroupId AS fromGroupId
          FROM groupIndex GI
          INNER JOIN groups G ON (GI.fromGroupId = G.id)
          INNER JOIN depthOwners DO ON (
          G.accountId = @clientAccountId
          AND G.clientId = DO.supervisorHrId
            AND (G.id = @rootGroupId OR G.groupTypeId = @orgGroupTypeId)
            AND DO.newGroupId > 0
          )
          UNION (
            SELECT G.id, @depth, G.id
            FROM groups G
            INNER JOIN depthOwners2 DO ON (
              G.accountId = @clientAccountId
                AND G.clientId = DO.hrId
                AND G.groupTypeId = @orgGroupTypeId
                AND G.depth = @depth
                AND DO.newGroupId > 0
              )
          )
          ORDER BY fromGroupId, depth ASC
        ;

        -- Add the owners of groups at this depth...EK
        INSERT INTO peopleGroups (groupId, peopleId, level, isPrimary)
          SELECT DO.newGroupId, DO.peopleId, 3, 2   -- 2 means the primary organization hierarchy group (not functional which is 1)...EK
          FROM depthOwners DO
          WHERE DO.newGroupId > 0
        ;
      `,
      transaction,
    })

    const [, depthIdsRes] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        TRUNCATE TABLE depthIds;
        INSERT INTO depthIds (id)
          SELECT peopleId
          FROM depthOwners
        ;
      `,
      transaction,
    })

    // TESTING
    const newAtDepth = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT *
        FROM depthOwners DO
        WHERE DO.newGroupId > 0
        ;
      `,
      transaction,
    })

    console.log('depthCounter', depthCounter)
    console.log('newAtDepth', newAtDepth)
    console.log('depthIdsRes.affectedRows', depthIdsRes.affectedRows)

    depthCounter += 1
    groupsAffected = depthIdsRes.affectedRows
  }

  // -- ================================================================================================================
  // -- 2 - We then need to make anyone who is either not in any org group, or in the wrong one they should be update (level 1 and isPrimary 2)
  // -- ================================================================================================================

  // Bulk link all people to their org group membership (not ones they own, ones they are a member of - the group they report to)
  const linkedOrgGroups = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE ${ingestionTableName} DFI
      INNER JOIN people P ON (DFI.peopleId = P.id)
      INNER JOIN people MGR ON (P.reportsTo = MGR.id)
      INNER JOIN groups MGR_G ON (MGR.hrId = MGR_G.clientId AND MGR_G.accountId = ${clientAccountId})
      SET DFI.groups_orgId = MGR_G.id
      ;
    `,
    transaction,
  })

  console.log('linkedOrgGroups', linkedOrgGroups)

  // TODO: Count how many groups org Id is not linked and not that as an ingestion EXCEPTION...EK
  const unlinkedOrgGroups = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT COUNT(*) AS count
      FROM ${ingestionTableName} DFI
      WHERE DFI.groups_orgId IS NULL
      ;
    `,
    transaction,
  })

  console.log('unlinkedOrgGroups', unlinkedOrgGroups)

  // Calculate differences (people who changed who they report to, or new people)
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      DROP TEMPORARY TABLE IF EXISTS groupLinkUpdates;
      CREATE TEMPORARY TABLE groupLinkUpdates AS
        SELECT DFI.peopleId,
          OG.id AS oldGroupId,
          IF(OGE.id IS NULL, 0, 1) AS oldGroupLinkExists,
          NG.id as newGroupId,
          IF(NGE.id IS NULL, 0, 1) AS newGroupLinkExists
        FROM ${ingestionTableName} DFI
        LEFT JOIN peopleGroups PG ON (PG.peopleId = DFI.peopleId AND PG.isPrimary = 2 AND PG.level = 1)
        LEFT JOIN groups OG ON (PG.groupId = OG.id)
        LEFT JOIN groups NG ON (DFI.groups_orgId = NG.id)
        LEFT JOIN peopleGroups NGE ON (PG.peopleId = NGE.peopleId AND NG.id = NGE.groupId)
        LEFT JOIN peopleGroups OGE ON (PG.peopleId = OGE.peopleId AND OG.id = OGE.groupId)
        WHERE IFNULL(PG.groupId, 0) <> DFI.groups_orgId
        ORDER BY PG.peopleId ASC
      ;
    `,
    transaction,
  })

  // Using the calculated differences above, if the new link exists, but is not primary make it primary 2 and level 1
  // This logic exists in the event a person was manually linked
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE peopleGroups PG
      INNER JOIN groupLinkUpdates U ON (
        PG.peopleId = U.peopleId
        AND PG.groupId = U.newGroupId
        AND PG.isPrimary = 0
        AND U.newGroupLinkExists = 1
      )
      SET
        PG.isPrimary = 2,
        PG.level = 1
      ;
    `,
    transaction,
  })

  // Using the calculated differences above, if the new link does not exist, but the old group does (and isPrimary and level match) move them to the new group link
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE peopleGroups PG
      INNER JOIN groupLinkUpdates U ON (
        PG.peopleId = U.peopleId
        AND PG.groupId = U.oldGroupId
        AND PG.isPrimary = 2
        AND PG.level = 1
        AND U.newGroupLinkExists = 0
      )
      SET
        PG.groupId = U.newGroupId
      ;
    `,
    transaction,
  })

  // Using the calculated differences above, Update the old link if it exists regardless of the primary / level flags
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
        PG.isPrimary = 2,
        PG.level = 1
      ;
    `,
    transaction,
  })

  // Insert new links if the old link and new link doesn't exist...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO peopleGroups (peopleId, groupId, level, isPrimary)
        SELECT U.peopleId, U.newGroupId, 1, 2
        FROM groupLinkUpdates U
        -- ENSURE the newGroupId doesn't already exist for the user (see above query for how this can happen)
        LEFT JOIN peopleGroups PG ON (PG.peopleId = U.peopleId AND PG.groupId = U.newGroupId)
        WHERE U.oldGroupLinkExists = 0      -- NOTE:  This works, but may be linked otherwise (primary/level) so still need other checks...EK
          AND PG.id IS NULL                 -- The newGroupId doesn't already exist for the user (can happen if was assigned manually)
      ;
    `,
    transaction,
  })

  // -- ================================================================================================================
  // -- 3 - We then need to move all groups where someone who manages people got a new manager.
  // -- ================================================================================================================

  // Calculate the group movements
  // Note: still using execute Non query because the replication delay...EK
  const orgGroupMoves = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT G.id as movingId, G.depth as movingDepth, targetG.id as targetId, targetG.depth as targetDepth
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
      INNER JOIN people MGR ON (P.reportsTo = MGR.id)
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.isPrimary = 2 AND PG.level = 3)
      INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
      INNER JOIN groups parentG ON (G.parentGroupId = parentG.id)
      INNER JOIN groups targetG ON (MGR.hrId = targetG.clientId)
      WHERE MGR.hrId <> parentG.clientId
      ORDER BY targetG.id ASC
      ;
    `,
    transaction,
  })

  console.log('orgGroupMoves.length', orgGroupMoves.length)

  while (orgGroupMoves.length > 0) {
    const movingGroup = orgGroupMoves.pop()
    console.log('movingGroup', movingGroup)

    const moveRes = await moveGroup({
      clientAccountId,
      movingGroup: { id: movingGroup.movingId, depth: movingGroup.movingDepth },
      newParentGroup: { id: movingGroup.targetId, depth: movingGroup.targetDepth },
      req: httpReq,
      transaction,
    })

    if (moveRes.success === false) {
      console.log('Failed to move:', moveRes.msg)
    }
  }

  // -- ================================================================================================================
  // -- 4 - Calculate a list of organization groups that have no members (except the owner) and consolidate them up to their parent
  // -- ================================================================================================================
  let groupsToDelete = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT P.status,		-- Must have status in the SELECT because of the HAVING clause...EK
        G.id AS 'groupId', G.depth AS 'groupDepth', PARENT_G.id AS 'targetId', PARENT_G.depth AS 'targetDepth', PARENT_G.parentGroupId AS 'targetParentId'
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
      INNER JOIN groups G ON (G.accountId = ${clientAccountId} AND G.clientId = P.hrId AND G.groupTypeId = ${orgGroupTypeId})
      INNER JOIN groups PARENT_G ON (G.parentGroupId = PARENT_G.id)
      LEFT JOIN people REPORTS ON (P.id = REPORTS.reportsTo)
      GROUP BY P.id
      HAVING
        P.status = 2 OR COUNT(REPORTS.id) = 0
      ;
    `,
    transaction,
  })

  // TODO: We need to scan the target groups to see if they are going to be deleted, if so we need to replace the soon-to-be deleted target group with the target of the deleting groups target...EK
  console.log('groupsToDelete.length', groupsToDelete.length)

  while (groupsToDelete.length > 0) {
    const deletingGroup = groupsToDelete.pop()
    console.log('deletingGroup', deletingGroup)

    const deleteRes = await deleteGroup({
      clientAccountId,
      deletingGroup: {
        id: deletingGroup.groupId,
        depth: deletingGroup.groupDepth,
      },
      delTargetGroup: {
        id: deletingGroup.targetId,
        depth: deletingGroup.targetDepth,
        parentGroupId: deletingGroup.targetParentId,
      },
      req: httpReq,
      transaction,
    })

    if (deleteRes.success === false) {
      console.log('Failed to delete:', deleteRes.msg)
    }
  }

  console.log('Organization group synchronization complete.')

  // This Because we auto commit by calling COMMIT manually above, this just does a no-op COMMIT and releases the connection...EK
  await wambiDB.commitTransaction(transaction)
}

module.exports = {
  handleOrganizationGroups,
}

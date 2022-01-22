import { USER_STATUS } from '@utils/types'

const matchExistingPeople = async ({ clientAccountId, ingestionTableName }) => {
  // Using the hrId, link existing people to the ingest table...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE ${ingestionTableName} DFI
      INNER JOIN people P ON (DFI.people_hrId = P.hrId)
      INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
      SET DFI.peopleId = P.id
      ;
    `,
  })
}

const ingestNewPeople = async (
  { clientAccountId, ingestionTableName, hrIdSuffix, logger, peopleMapWithHR },
  { birthdayPublic = 1, enableEmailCampaignSync = 1 } = {}
) => {
  await logger.logInfo('Handling new people...')

  // For people records incoming that are unlinked, add a suffix with the client account Id to track for new people...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE ${ingestionTableName} DFI
      SET DFI.people_hrId = CONCAT(DFI.people_hrId, '${hrIdSuffix}')
      WHERE DFI.peopleId IS NULL
      ;
    `,
  })

  // New people - These are DFI records without a peopleId assigned in the above step...EK
  const peopleInsertRes = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO people (${peopleMapWithHR.map(fm => fm.target.field).join(', ')}, birthdayPublic, enableEmailCampaignSync, lastIngestedAt)
        SELECT ${peopleMapWithHR.map(fm => fm.source).join(', ')}, ${birthdayPublic}, ${enableEmailCampaignSync}, CURRENT_TIMESTAMP
        FROM ${ingestionTableName} DFI
        WHERE DFI.peopleId IS NULL
      ;
    `,
  })

  if (peopleInsertRes.affectedRows > 0) {
    // This means people were created, handle the new people...EK

    // Pull the newly created people IDs into the import table (using the __{clientAccountId} marker)...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestionTableName} DFI
        INNER JOIN people P ON (DFI.people_hrId = P.hrId)
        SET DFI.peopleId = P.id
        WHERE DFI.peopleId IS NULL
        ;
      `,
    })

    // Update the hrId for newly created records...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN ${ingestionTableName} DFI ON (DFI.peopleId = P.id)
        SET P.hrId = LEFT(DFI.people_hrId, LENGTH(DFI.people_hrId) - ${hrIdSuffix.length})
        WHERE SUBSTRING(P.hrId, -${hrIdSuffix.length}) = '${hrIdSuffix}'
        ;
      `,
    })

    // For the new people, link to the client account...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel, hideFromPortal)
          SELECT ${clientAccountId}, DFI.peopleId, 1, 0
          FROM ${ingestionTableName} DFI
          LEFT JOIN clientAccountPeople CAP ON (DFI.peopleId = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          WHERE CAP.id IS NULL  -- Meaning there isn't a client account linker already
        ;
      `,
    })
  }

  await logger.logInfo(`New people created: ${peopleInsertRes.affectedRows}`)
}

const ingestPeopleUpdates = async ({ clientAccountId, ingestionTableName, logger, peopleMapWithoutHR, tempTableFields }) => {
  await logger.logInfo('Handling people basic updates...')
  // NOTE: This is an overwrite, not a merge operation. If a user updates their email address it will be overwritten here...EK
  // Update people based on the data in the ingestion table...EK
  const peopleUpdated = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE people P
      INNER JOIN ${ingestionTableName} DFI ON (P.id = DFI.peopleId)
      SET ${peopleMapWithoutHR.map(fm => `P.${fm.target.field} = DFI.${fm.source}`).join(', ')}, lastIngestedAt = CURRENT_TIMESTAMP
      ;
    `,
  })

  await logger.logInfo(`People updated: ${peopleUpdated.changedRows}`)

  let reportsToUpdated = null
  // Handle Reports to
  if (tempTableFields.find(f => f.startsWith('people_reportsTo'))) {
    // This import contains the reports to field, so link people to their managers...EK
    await logger.logInfo('Handling people "reports to" updates...')
    reportsToUpdated = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN ${ingestionTableName} DFI ON (P.id = DFI.peopleId)
        INNER JOIN people MGR ON (DFI.people_reportsTo = MGR.hrId)
        INNER JOIN clientAccountPeople CAP ON (MGR.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        SET P.reportsTo = MGR.id
        ;
      `,
    })

    await logger.logInfo(`People "reports to" updated: ${reportsToUpdated.changedRows}`)
  }
}

const reactivatePeople = async ({ ingestionTableName, logger }, andWhere = '') => {
  await logger.logInfo('Handling reactivating people (rehires)...')
  // Reactivate people if they are not active, but are showing in the ingest file...EK
  const reactivatedPeople = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE people P
      INNER JOIN ${ingestionTableName} DFI ON (P.id = DFI.peopleId)
      SET
        P.status = ${USER_STATUS.ACTIVE},
        P.deactivatedAt = NULL
      WHERE P.status = ${USER_STATUS.DISABLED}
        ${andWhere}
      ;
    `,
  })

  await logger.logInfo(`Reactivated people: ${reactivatedPeople.changedRows}`)
}

const deactivatePeople = async ({ clientAccountId, ingestionTableName, logger }, andWhere = '') => {
  await logger.logInfo('Handling deactivations...')

  // Handle the users who are no longer in the import (they are deactivated by default)...EK
  // NOTE: This query is customized for HMH...EK
  const peopleDeactivated = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      LEFT JOIN ${ingestionTableName} DFI ON (P.id = DFI.peopleId)
      SET
        P.status = ${USER_STATUS.DISABLED},
        P.deactivatedAt = CURRENT_TIMESTAMP
      WHERE DFI.peopleId IS NULL
        AND P.status = ${USER_STATUS.ACTIVE}
        AND P.isSelfRegistered = 0    -- The person must not have self registered...EK
        ${andWhere}
      ;
    `,
  })

  await logger.logInfo(`Deactivated people: ${peopleDeactivated.affectedRows}`)
}

module.exports = {
  deactivatePeople,
  ingestNewPeople,
  ingestPeopleUpdates,
  matchExistingPeople,
  reactivatePeople,
}

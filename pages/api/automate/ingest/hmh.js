import {
  associatePeopleWithCostGroups,
  cleanUpOldFiles,
  createIngestTableFromSources,
  deactivatePeople,
  generateCostGroupClientIds,
  getIngestFileKey,
  handleOrganizationGroups,
  ingestCustomTraits,
  ingestNewPeople,
  ingestPeopleUpdates,
  matchExistingPeople,
  parseIngestSourceFiles,
  reactivatePeople,
} from '@serverHelpers/ingest'

import { GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils/types'
import { hashPassword } from '@serverHelpers/security'

export default async (req, res) => {
  const { clientAccount } = req

  try {
    // Verify that the request is for hmh client account...EK
    if (clientAccount.host.split('.')[0] !== 'hmh') {
      return res.json({ msg: 'Incorrect client account DNS for HMH ingestion.  Check the host in your request.', success: false })
    }

    // Get latest HMH import file...EK
    const hmhImportFile = await getIngestFileKey('sftp-hmh', 'xlsx')

    // Get latest Carrier import file...EK
    const carrierImportFile = await getIngestFileKey('hmh-cc-sftp', 'csv')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/hmh-config.json',
        importFileKey: hmhImportFile.Key,
      },
      {
        configKey: 'configs/hmh-cc-config.json',
        importFileKey: carrierImportFile.Key,
      },
    ])

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // HMH CUSTOM: remove people who should not show up in the feed... EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE DFI
        FROM ${ingestScope.ingestionTableName} DFI
        WHERE DFI.groups_site = 'HCC'   -- The site code for carrier people that shows up in the HMH feed
          OR DFI.people_jobTitle = 'Non Employee Leader'   -- Per FD 4481 All "Non Employee Leaders" are to be deactivated and not included...EK
        ;
      `,
    })

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // Perform the actual import...EK
    await ingestNewPeople(ingestScope, { birthdayPublic: 0, enableEmailCampaignSync: 1 })
    await ingestPeopleUpdates(ingestScope)
    await reactivatePeople(ingestScope)
    await ingestCustomTraits(ingestScope)

    // HMH CUSTOM: Consolidate home care groups into consolidated groups...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.groups_deptId = LEFT(DFI.groups_deptId, 5)
        WHERE (
          DFI.groups_deptId LIKE '30384%'
          OR DFI.groups_deptId LIKE '30385%'
          OR DFI.groups_deptId LIKE '30388%'
          OR DFI.groups_deptId LIKE '30389%'
          OR DFI.groups_deptId LIKE '30390%'
          OR DFI.groups_deptId LIKE '30391%'
          OR DFI.groups_deptId LIKE '30392%'
          OR DFI.groups_deptId LIKE '30398%'
          OR DFI.groups_deptId LIKE '33570%'
          OR DFI.groups_deptId LIKE '33575%'
          OR DFI.groups_deptId LIKE '33680%'
        )
        ;
      `,
    })

    // HMH CUSTOM: We update the site code to CC because that is the abriv given in W3...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET groups_site = 'CC'
        WHERE groups_site = 'HMH Carrier Clinic'
        ;
      `,
    })

    await generateCostGroupClientIds(ingestScope, 'CONCAT(DFI.groups_deptId, DFI.groups_site)')

    // HMH CUSTOM: If we still have groups that are not linked, remove a 'C' char in the cost center to consolidate them...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.groups_deptId = LEFT(DFI.groups_deptId, LENGTH(DFI.groups_deptId) - 1)
        WHERE DFI.groups_id IS NULL
          AND RIGHT(DFI.groups_deptId, 1) = 'C'
        ;
      `,
    })

    await generateCostGroupClientIds(ingestScope, 'CONCAT(DFI.groups_deptId, DFI.groups_site)')
    await associatePeopleWithCostGroups(
      ingestScope,
      `IF(IFNULL(DFI.peopleGroups_level, 'Non-Manager') = 'Non-Manager', ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, ${GROUP_ACCESS_LEVELS.GROUP_OWNER})`
    )

    await deactivatePeople(
      ingestScope,
      `
        AND P.email NOT LIKE '%wambi.org%'
        AND P.displayName NOT LIKE '%Office of%'
        AND P.firstName NOT LIKE '%Office of%'
        AND P.lastName NOT LIKE '%Office of%'
        AND P.hrId <> 'hmhculture1'
      `
    )

    await handleOrganizationGroups(ingestScope, {
      rootLeaderHrId: '0088492',
      orgGroupTypeId: 123,
      groupNameFormula: 'CONCAT(DO.fullName, "\'s Team")',
    })

    // HMH CUSTOM: Carrier users do not have SSO, so new users must be set a default password...EK

    // This calculates users who have no password so they can be set...EK
    const usersWithBlankPasswords = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.hrId
        FROM people P
        WHERE id IN (
          SELECT P.id
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${ingestScope.clientAccountId})
          INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
          -- NOTE: GI.groupId = 174 = Carrier "facility" in production
          INNER JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId AND GI.groupId = 174)
          WHERE P.passwordHash IS NULL
            AND P.status = ${USER_STATUS.ACTIVE}
        )
        ;
      `,
    })

    // Set the password for each person (for HMH Carrier, it defaults to their HrId)...EK
    if (usersWithBlankPasswords.length > 0) {
      for (let i = 0; i < usersWithBlankPasswords.length; i++) {
        const person = usersWithBlankPasswords[i]
        person.passwordHash = await hashPassword(person.hrId)
      }

      // Execute the update statement to set the newly generated password hashes...EK
      await wambiDB.executeNonQuery({
        commandText: usersWithBlankPasswords
          .map(
            p => /*sql*/ `
              UPDATE people
              SET passwordHash = '${p.passwordHash}'
              WHERE id = ${p.id}
            `
          )
          .join(';\n'),
      })
    }

    // // Remove old files (not including the files we just imported in case we need to reference them)...EK
    await cleanUpOldFiles('sftp-hmh', [hmhImportFile.Key])
    await cleanUpOldFiles('hmh-cc-sftp', [carrierImportFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
}

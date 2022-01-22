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

import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  const { clientAccount } = req

  try {
    // Verify that the request is for hmh client account...EK
    if (clientAccount.host.split('.')[0] !== 'promedica') {
      return res.json({ msg: 'Incorrect client account DNS for PROMEDICA ingestion.  Check the host in your request.', success: false })
    }

    // Get latest import file...EK
    const importFile = await getIngestFileKey('sftp-promedica', 'csv')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/promedica-config.json',
        importFileKey: importFile.Key,
        options: {
          parserOptions: {
            delimiter: '|',
          },
        },
      },
    ])

    // CUSTOM: Remove the rows that are not the person's primary role (NOTE: we need to do this before we ingest because it will delete without logic )
    const { config, worksheet } = fileSources[0]
    const primaryPositionSource = config.fieldMap.find(f => f.source === 'custom_primaryPosition')

    const rowsToRemove = []
    worksheet.eachRow((row, rowNumber) => {
      if (row.getCell(primaryPositionSource.sourceColumnIdx).value === 'False') {
        rowsToRemove.push(rowNumber)
      }
    })

    rowsToRemove.forEach((rowToRemove, idx) => worksheet.spliceRows(rowToRemove - idx, 1))

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // CUSTOM: Add the pilot column to the ingestion table...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ALTER TABLE ${ingestScope.ingestionTableName}
        ADD COLUMN activePilot TINYINT(4) NULL DEFAULT 0
        ;
      `,
    })

    // CUSTOM: Add client rules for inclusion...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName}
        SET activePilot = 1
        WHERE
          -- In Monroe Regional Hospital
          custom_processLevelCode = 'N070H'
            -- List of departments
            AND groups_deptId IN (
            '6011',		-- Nursing Administration
            '6012',		-- Nursing Staff Support
            '6018',		-- Residency Ctr for Nursing Exc
            '6023',		-- Medical Unit 4N
            '6041',		-- Cardiac Intermed Care 3S
            '6045',		-- Surgical Unit 2S
            '6072',		-- Obstetrics
            '6120',		-- Critical Care Unit
            '6231',		-- Emergency Services
            '8425',		-- Medical Education
            '8432',		-- Emergency Medl Education
            '8433',		-- Internship Residency-rotating
            '8942'		-- Service Excellence (People in this group should not be on the portal)
            )
        ;
      `,
    })

    // CUSTOM: We need to be sure that manually added people are also tagged to be included (even if they don't match the criteria above)...EK
    const manuallyAddedTraitId = clientAccount.host === 'promedica.wambiapp.com' ? 733 : 0

    // CUSTOM: Ensure manually entered people are active in the pilot ...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.activePilot = 1
        WHERE DFI.people_hrId IN (
          SELECT P.hrId
          FROM people P
          INNER JOIN peopleTraits PT ON (P.id = PT.peopleId AND PT.traitId = ${manuallyAddedTraitId})
        )
        ;
      `,
    })

    // CUSTOM: We now take those who are active and walk up the hierarchy to capture all managers not included but still need for the org hierarchy...EK
    let managersAdded = 1

    while (managersAdded > 0) {
      const managerUpdateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE ${ingestScope.ingestionTableName} DFI
          INNER JOIN (
            SELECT DISTINCT DFI.people_reportsTo
              FROM ${ingestScope.ingestionTableName} DFI
              LEFT JOIN ${ingestScope.ingestionTableName} DFI_MGR ON (DFI.people_reportsTo = DFI_MGR.people_hrId AND DFI_MGR.activePilot = 1)
              WHERE
                DFI.activePilot = 1
                AND DFI_MGR.id IS NULL
          ) I ON (DFI.people_hrId = I.people_reportsTo)
          SET DFI.activePilot = 1
          ;
        `,
      })

      managersAdded = managerUpdateRes.affectedRows
    }

    // CUSTOM: Now we can DELETE anyone not included either actively or inactively in the pilot...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE DFI
        FROM ${ingestScope.ingestionTableName} DFI
        WHERE DFI.activePilot = 0
        ;
      `,
    })

    // CUSTOM: We need to assign the "Area" trait based on department cross reference...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DROP TEMPORARY TABLE IF EXISTS areaTraitCrossRef;
        CREATE TEMPORARY TABLE areaTraitCrossRef AS
        SELECT '6011' AS deptId, 'Nursing Administration' AS trait
          UNION SELECT '6012', '2 South'
          UNION SELECT '6018', '2 South'
          UNION SELECT '6045', '2 South'
          UNION SELECT '8425', '2 South'
          UNION SELECT '6011', '2 South'
          UNION SELECT '8433', '2 South'
          UNION SELECT '6012', '3 South'
          UNION SELECT '6018', '3 South'
          UNION SELECT '6041', '3 South'
          UNION SELECT '8425', '3 South'
          UNION SELECT '6011', '3 South'
          UNION SELECT '8433', '3 South'
          UNION SELECT '6012', '4 North'
          UNION SELECT '6018', '4 North'
          UNION SELECT '6023', '4 North'
          UNION SELECT '8425', '4 North'
          UNION SELECT '6011', '4 North'
          UNION SELECT '8433', '4 North'
          UNION SELECT '6012', 'OB'
          UNION SELECT '6018', 'OB'
          UNION SELECT '6072', 'OB'
          UNION SELECT '8425', 'OB'
          UNION SELECT '6011', 'OB'
          UNION SELECT '8433', 'OB'
          UNION SELECT '6012', 'ICU'
          UNION SELECT '6018', 'ICU'
          UNION SELECT '6120', 'ICU'
          UNION SELECT '8425', 'ICU'
          UNION SELECT '6011', 'ICU'
          UNION SELECT '8433', 'ICU'
          UNION SELECT '6012', 'Emergency Department'
          UNION SELECT '6018', 'Emergency Department'
          UNION SELECT '6231', 'Emergency Department'
          UNION SELECT '8432', 'Emergency Department'
          UNION SELECT '8433', 'Emergency Department'
        ;
          
        UPDATE ${ingestScope.ingestionTableName} DFI
        INNER JOIN areaTraitCrossRef CR ON (DFI.groups_deptId = CR.deptId)
        SET DFI.trait_74 = CR.trait
        ;
        
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.trait_74 = NULL
        WHERE DFI.trait_74 = 'deptCrossRef'
        ;
        
        DROP TEMPORARY TABLE IF EXISTS areaTraitCrossRef
        ;
      `,
    })

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // // Perform the actual import...EK
    await ingestNewPeople(ingestScope)
    await ingestPeopleUpdates(ingestScope)
    await reactivatePeople(ingestScope)

    await ingestCustomTraits(ingestScope)

    await generateCostGroupClientIds(ingestScope, 'DFI.groups_deptId')
    await associatePeopleWithCostGroups(
      ingestScope,
      `IF(IFNULL(DFI.peopleGroups_level, 'Non-Manager') = 'Non-Manager', ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, ${GROUP_ACCESS_LEVELS.GROUP_OWNER})`
    )

    await deactivatePeople(
      ingestScope,
      `
      AND P.email NOT LIKE '%wambi.org%'
      AND P.id NOT IN (SELECT peopleId FROM peopleTraits PT WHERE PT.traitId = ${manuallyAddedTraitId})
    `
    )

    // Handle organization hierarchy updates...EK
    await handleOrganizationGroups(ingestScope, {
      rootLeaderHrId: '194183',
      orgGroupTypeId: 119,
      groupNameFormula: 'CONCAT(DO.fullName, "\'s Group")',
    })

    // CUSTOM: We need to make sure the list of leaders here are incognito and have their notifications turned off...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = 18)
        INNER JOIN (
        SELECT '12743' COLLATE utf8mb4_general_ci AS hrId
          UNION SELECT '70649'
          UNION SELECT '84533'
          UNION SELECT '89292'
          UNION SELECT '145383'
          UNION SELECT '165001'
          UNION SELECT '194183'
          UNION SELECT '202523'
          UNION SELECT '204271'
          UNION SELECT '266585'
          UNION SELECT '503767'
          UNION SELECT '525333'
          UNION SELECT '608601'
          UNION SELECT '610270'
          UNION SELECT '610276'
          UNION SELECT '610610'
          UNION SELECT '612783'
          UNION SELECT '613724'
          UNION SELECT '704778'
          UNION SELECT '706777'
          UNION SELECT '709310'
          UNION SELECT '710400'
          UNION SELECT '713573'
          UNION SELECT '715238'
          UNION SELECT '716452'
          UNION SELECT '719629'
          UNION SELECT '721671'
          UNION SELECT '727600'
          UNION SELECT '728238'
          UNION SELECT '728643'
          UNION SELECT '734983'
          UNION SELECT '737289'
          UNION SELECT '1001772'
      ) T ON (P.hrId = T.hrId)
      SET
        P.notifyMethod = 0,
        P.enableEmailCampaignSync = 0,
        CAP.isIncognito = 1
      ;
    `,
    })

    // Remove old files (not including the files we just imported in case we need to reference them)...EK
    await cleanUpOldFiles('sftp-promedica', [importFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}

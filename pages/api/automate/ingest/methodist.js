import {
  associatePeopleWithCostGroups,
  createIngestTableFromSources,
  cleanUpOldFiles,
  deactivatePeople,
  generateCostGroupClientIds,
  getIngestFileKey,
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
    if (clientAccount.host.split('.')[0] !== 'methodist') {
      return res.json({ msg: 'Incorrect client account DNS for Methodist ingestion.  Check the host in your request.', success: false })
    }

    // Get latest import file...EK
    const importFile = await getIngestFileKey('sftp-methodist', 'csv')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/methodist-config.json',
        importFileKey: importFile.Key,
      },
    ])

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // CUSTOM: Pad the hrId to up to six chars (must be done before creating the ingestion file)
    //  NOTE: Due to this being a csv, the preceding 0s are stripped off, this adds them back...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName}
        SET
          people_hrId = RIGHT(CONCAT('000000', people_hrId), 6),
          people_loginId = RIGHT(CONCAT('000000', people_hrId), 6),
          people_reportsTo = RIGHT(CONCAT('000000', people_reportsTo), 6)
        ;
      `,
    })

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // // Perform the actual import...EK
    await ingestNewPeople(ingestScope)
    await ingestPeopleUpdates(ingestScope)
    await reactivatePeople(ingestScope)

    await generateCostGroupClientIds(ingestScope, 'DFI.groups_deptId')
    await associatePeopleWithCostGroups(
      ingestScope,
      `
      IF(IFNULL(DFI.peopleGroups_level, 'Team') = 'Team', ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, ${GROUP_ACCESS_LEVELS.GROUP_OWNER})
    `
    )

    // CUSTOM: This account has a trait linked to people who are manually added that we ignore during the deactivate process...EK
    const doNotDeactivateTraitId = clientAccount.host === 'methodist.wambiapp.com' ? 401 : 0
    await deactivatePeople(
      ingestScope,
      `
      AND P.email NOT LIKE '%wambi.org%'
      AND P.id NOT IN (SELECT peopleId FROM peopleTraits WHERE traitId = ${doNotDeactivateTraitId})
    `
    )

    // // Remove old files (not including the files we just imported in case we need to reference them)...EK
    await cleanUpOldFiles('sftp-methodist', [importFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}

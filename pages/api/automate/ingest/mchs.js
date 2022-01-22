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
    if (clientAccount.host.split('.')[0] !== 'mchs') {
      return res.json({ msg: 'Incorrect client account DNS for MCHS ingestion.  Check the host in your request.', success: false })
    }

    // Get latest import file...EK
    const importFile = await getIngestFileKey('sftp-marshfield', 'csv')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/mchs-config.json',
        importFileKey: importFile.Key,
      },
    ])

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // Perform the actual import...EK
    await ingestNewPeople(ingestScope)
    await ingestPeopleUpdates(ingestScope)
    await reactivatePeople(ingestScope)
    await ingestCustomTraits(ingestScope)

    await generateCostGroupClientIds(
      ingestScope,
      `CONCAT(CONVERT(LEFT(MD5(LEFT(DFI.groups_site, 45)), 5) USING utf8mb4), '${'-'}', DFI.groups_deptId)`
    )
    await associatePeopleWithCostGroups(
      ingestScope,
      `IF(IFNULL(DFI.peopleGroups_level, '7 Individual Contributor') = '7 Individual Contributor', ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, ${GROUP_ACCESS_LEVELS.GROUP_OWNER})`
    )

    await deactivatePeople(
      ingestScope,
      `AND P.email NOT LIKE '%wambi.org%'
      `
    )

    await handleOrganizationGroups(ingestScope, {
      rootLeaderHrId: '88793',
      orgGroupTypeId: 111,
      groupNameFormula: 'CONCAT(DO.fullName, "\'s Group")',
    })

    // Remove old files (not including the files we just imported in case we need to reference them)...EK
    await cleanUpOldFiles('sftp-marshfield', [importFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
}

import {
  // associatePeopleWithCostGroups,
  // cleanUpOldFiles,
  createIngestTableFromSources,
  // deactivatePeople,
  // generateCostGroupClientIds,
  getIngestFileKey,
  // ingestNewPeople,
  // ingestPeopleUpdates,
  matchExistingPeople,
  parseIngestSourceFiles,
  // reactivatePeople,
} from '@serverHelpers/ingest'

// import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  const { clientAccount } = req

  try {
    // Verify that the request is for hmh client account...EK
    if (clientAccount.host.split('.')[0] !== 'kpsjo') {
      return res.json({ msg: 'Incorrect client account DNS for KPSJO ingestion.  Check the host in your request.', success: false })
    }

    // Get latest import file...EK
    const importFile = await getIngestFileKey('sftp-kpsjo', 'xlsx')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/kpsjo-config.json',
        importFileKey: importFile.Key,
      },
    ])

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // Perform the actual import...EK
    // await ingestNewPeople(ingestScope)
    // await ingestPeopleUpdates(ingestScope)
    // await reactivatePeople(ingestScope)

    // await generateCostGroupClientIds(ingestScope, 'DFI.groups_deptId')
    // await associatePeopleWithCostGroups(
    //   ingestScope,
    //   `IF(IFNULL(DFI.peopleGroups_level, 'No') = 'No', ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, ${GROUP_ACCESS_LEVELS.GROUP_OWNER})`
    // )

    // await deactivatePeople(
    //   ingestScope,
    //   `
    //   AND P.email NOT LIKE '%wambi.org%'
    // `
    // )

    // // Remove old files (not including the files we just imported in case we need to reference them)...EK
    // await cleanUpOldFiles('sftp-eogh', [importFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}

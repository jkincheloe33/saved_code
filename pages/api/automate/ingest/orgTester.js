import { handleOrganizationGroups } from '@serverHelpers/ingest'

export default async (req, res) => {
  const { clientAccount } = req

  try {
    await handleOrganizationGroups(
      {
        clientAccountId: clientAccount.id,
        ingestionTableName: `dataFileIngestion_${clientAccount.id}`,
        logger: {
          logInfo: console.log,
          logWarning: console.warn,
        },
      },
      {
        rootLeaderHrId: '194183',
        orgGroupTypeId: 119,
        groupNameFormula: 'CONCAT(DO.fullName, "\'s Group")',
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}

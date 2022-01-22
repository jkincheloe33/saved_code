import { createSimpleWorkbook } from '@serverHelpers/excel'

export default async (req, res) => {
  const { clientAccount } = req

  const traitTypesForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT id, name
      FROM traitTypes
      WHERE accountId = ?
      ORDER BY name ASC
    `,
    params: [clientAccount.id],
  })

  const { workbook } = createSimpleWorkbook({
    worksheetName: `People Import - ${clientAccount.name}`,
    columns: [
      // These are the standard fields that are imported directly to a people record...EK
      { header: 'hrId', width: 10 },
      { header: 'loginId', width: 10 },
      { header: 'firstName', width: 10 },
      { header: 'lastName', width: 10 },
      { header: 'prefix', width: 10 },
      { header: 'displayName', width: 10 },
      { header: 'jobTitle', width: 10 },
      { header: 'jobTitleDisplay', width: 10 },
      { header: 'email', width: 10 },
      { header: 'mobile', width: 10 },
      { header: 'hireDate', width: 10 },
      { header: 'birthday', width: 10 },
      { header: 'birthdayPublic', width: 10 },
      { header: 'enableEmailCampaignSync', width: 10 },
      { header: 'ssoId', width: 10 },

      // This column, if kept in the import sheet will update reportsTo people column based on the HR ID specified here...EK
      { header: 'Reports To - HR ID', width: 10 },

      // This column, if kept on import will automatically link the person to the group using the specified client ID of the group...EK
      { header: 'Group - Client ID', width: 10 },

      // If these columns are kept, on import the person will be linked to the trait by trait name specified in theses trait type columns...EK
      ...traitTypesForAccount.map(traitType => {
        return {
          header: `Trait - ${traitType.name} | ${traitType.id}`,
          width: 10,
        }
      }),
    ],
    rows: [{}],
  })

  await workbook.xlsx.write(res)
  res.end()
}

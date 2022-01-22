import { createSimpleWorkbook } from '@serverHelpers/excel'

export default async (req, res) => {
  const { workbook } = createSimpleWorkbook({
    worksheetName: `Group Import - ${req.clientAccount.name}`,
    columns: [
      { header: 'name', width: 10 },
      { header: 'description', width: 10 },
      { header: 'clientId', width: 10 },
    ],
    rows: [{}],
  })

  await workbook.xlsx.write(res)
  res.end()
}

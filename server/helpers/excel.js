const ExcelJS = require('exceljs')

module.exports = {
  createSimpleWorkbook: ({ worksheetName = 'Sheet1', columns = [], rows = [], creator = 'Wambi Web Portal' }) => {
    const workbook = new ExcelJS.Workbook()

    workbook.creator = creator
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet(worksheetName)
    worksheet.columns = columns
    worksheet.addRows(rows)

    return {
      workbook,
      worksheet,
    }
  },
  openSheetAndParseRows: async ({ buffer, sheetIndex = 0 }) => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[sheetIndex]
    const columnHeaders = worksheet.getRow(1).values

    const rows = []
    worksheet.eachRow((sourceRow, rowNum) => {
      if (rowNum > 1) {
        let row = {}
        for (let i = 1; i < columnHeaders.length; i++) {
          row[columnHeaders[i]] = sourceRow.values[i]
        }
        rows.push(row)
      } else {
        // Don't include the header row...EK
      }
    })

    return {
      workbook,
      worksheet,
      // NOTE: splice 1 to skip the empty 0-based header & value...EK
      columnHeaders: columnHeaders.splice(1),
      rows,
    }
  },
  extractCellValue: (cell, strToDate = false) => {
    if (cell == null) return null

    switch (cell.type) {
      case ExcelJS.ValueType.Hyperlink:
        return cell.value.text
      case ExcelJS.ValueType.Formula:
        return cell.value.result
      default:
        if (cell.value === '') cell.value = null
        if (cell.value && strToDate) return new Date(cell.value)
        return cell.value
    }
  },
}

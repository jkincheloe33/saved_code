module.exports = {
  recordAuditTrail: async (userId, action, tableName, primaryKey, row) => {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO auditTrail
        SET ?
      `,
      params: [{ userId, action, tableName, primaryKey, rowData: JSON.stringify(row) }],
    })
  },
}

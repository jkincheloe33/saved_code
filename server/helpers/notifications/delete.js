const deleteNotification = async ({ accountId, id, tableName }) => {
  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
      DELETE N FROM notifications N
      INNER JOIN notificationLinks NL ON (NL.notificationId = N.id AND NL.tableKey = ? AND NL.tableName = ?)
      WHERE N.accountId = ?
    `,
      params: [id, tableName, accountId],
    })
  } catch (error) {
    console.error('Error in deleting notification: ', error)
  }
}

module.exports = deleteNotification

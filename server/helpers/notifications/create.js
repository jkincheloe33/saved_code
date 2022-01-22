/**
 * Insert notifications and notification links into the database
 *
 * @param {Array} notificationParams an array of notification details (eg. recipients, sender, content, etc.)
 * @param {Array} linkParams an array of link blueprint for notifications (eg. images, trigger, etc)
 *
 */

const createNotification = async (notificationParams, linkParams) => {
  try {
    let page = 0
    // Size at 2000 so that inserts at most is 8000...CY
    const pageSize = 2000

    // Chunk the data into smaller datasets to insert...CY
    while (page * pageSize <= notificationParams.length) {
      const chunk = notificationParams.slice(page * pageSize, (page + 1) * pageSize)

      const insertNotificationsQuery = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO notifications (peopleId, content, type, status, accountId) VALUES ?
        `,
        params: [chunk.map(n => [n.peopleId, n.content, n.type, n.status, n.accountId])],
      })

      // Create array of inserted notification Ids...CY
      const insertIndexes = Array.from({ length: insertNotificationsQuery.affectedRows }, (_, i) => insertNotificationsQuery.insertId + i)

      // Create an array of links and inject notification ids...CY
      const links = insertIndexes.flatMap(linkParams)

      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO notificationLinks (notificationId, tableName, tableKey, notificationLinks.usage) VALUES ?
        `,
        params: [links.map(link => [link.notificationId, link.tableName, link.tableKey, link.usage])],
      })

      page++
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = createNotification

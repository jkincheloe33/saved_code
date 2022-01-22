const { FEED_ITEM_STATUS, FEED_ITEM_TYPES } = require('@utils/types')

const getGroupWambis = async ({ clientAccountId, groupId, limit, page = 0, req }) => {
  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    // Create temp feedItems table to pull Wambis & related data against...JC
    const [, , cpcList] = await wambiDB.query({
      transaction,
      queryText: /*sql*/ `
        DROP TEMPORARY TABLE IF EXISTS groupFeedItems;

        CREATE TEMPORARY TABLE groupFeedItems (
          SELECT FI.id, FI.content, FI.authorId, FI.createdAt
          FROM feedItems FI
          INNER JOIN feedGroups FG ON (FI.id = FG.feedId AND FG.groupId = ?)
          WHERE FI.accountId = ${clientAccountId}
            AND FI.status = ${FEED_ITEM_STATUS.VISIBLE}
            AND FI.itemType = ${FEED_ITEM_TYPES.CPC}
          ORDER BY FI.createdAt DESC
          LIMIT ?, ?
        );

        SELECT DISTINCT FI.id AS feedId, FI.content, FI.createdAt,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), 1), LEFT(SP.lastName, 1))) AS authorImg,
            CONCAT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), ' ', SP.lastName) AS sender,
          IFNULL(NULLIF(SP.displayName, ''), SP.firstName) AS recipient,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner
        FROM groupFeedItems FI
        INNER JOIN people SP ON (SP.id = FI.authorId)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (SP.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id);
      `,
      params: [groupId, page * limit, limit],
    })

    if (cpcList.length) {
      const recipients = await wambiDB.query({
        transaction,
        queryText: /*sql*/ `
          SELECT FI.id AS feedId, FP.id AS recipientId,
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
            IFNULL(P.jobTitleDisplay, P.jobTitle) AS title,
            IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
          FROM groupFeedItems FI
          INNER JOIN feedPeople FP ON (FP.feedId = FI.id)
          INNER JOIN people P ON (FP.peopleId = P.id)
          LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
          LEFT JOIN media M ON (ML.mediaId = M.id)
          WHERE FI.id IN (?)
        `,
        params: [cpcList.map(fi => fi.feedId)],
      })

      const combinedQuery = cpcList.map(e => ({
        ...e,
        recipient: recipients.filter(({ feedId }) => feedId === e.feedId),
      }))

      combinedQuery.forEach(e => {
        e.recipientCount = e.recipient.length
        if (e.recipientCount === 1) {
          e.recipient = e.recipient[0].name
        }
      })

      await wambiDB.commitTransaction(transaction)
      return { success: true, cpcList: combinedQuery }
    } else {
      await wambiDB.commitTransaction(transaction)
      return { success: true, cpcList: [] }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error inside of getGroupWambis', error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    return { success: false }
  }
}

module.exports = getGroupWambis

import { FEED_ITEM_STATUS } from '@utils/types'

module.exports = {
  /**
   * Get newsfeed pin post for the initial request(page = 0) and delete dismissed pin entries
   *
   * @param {Number} clientAccountId clientAccount of the current app
   * @param {Number} page Current page of the newsfeed
   * @param {Number} userId Session user
   *
   * @returns {Array} empty array if the page > 0 or pin items
   */

  getPinItems: async ({ clientAccountId, page, userId }) => {
    //Return empty array if not on the first page
    if (page > 0) return []

    const pinnedItems = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT
          FI.id, FI.itemType, FI.content, FI.createdAt, FI.cpcId, FI.editedAt,
          A.id AS authorId, 
          IFNULL(A.jobTitleDisplay, A.jobTitle) AS authorTitle,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(A.displayName, ''), A.firstName), 1), LEFT(A.lastName, 1))) AS authorImg,
          CONCAT(IFNULL(NULLIF(A.displayName, ''), A.firstName), ' ', A.lastName) AS authorName,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner,
          -- Add flag for feedItems that are pinned...CY
          1 AS isPinned
        FROM (
          -- This sub-select does all the feed realm filtering with INNER JOINs...EK
          SELECT DISTINCT FI.id
          FROM feedItems FI
          INNER JOIN feedGroups FG ON (FI.id = FG.feedId AND 
            FI.accountId = ${clientAccountId} AND 
            FI.status = ${FEED_ITEM_STATUS.VISIBLE} AND 
            FI.pinUntil > CURRENT_TIMESTAMP
          )
          INNER JOIN groupIndex GI ON (FG.groupId = GI.groupId)    
          INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userId})
          LEFT JOIN dismissedPins DP ON (DP.feedId = FI.id AND DP.peopleId = ${userId})
          WHERE DP.id IS NULL
          ORDER BY FI.sortDate DESC
        ) FF
        INNER JOIN feedItems FI ON (FF.id = FI.id)
        LEFT JOIN people A ON (FI.authorId = A.id)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (A.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
      `,
    })

    // Remove dismissed pins when post pin expires...CY
    wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE DP
        FROM dismissedPins DP 
        INNER JOIN feedItems FI ON (DP.feedId = FI.id 
          AND DP.peopleId = ${userId}
          AND (FI.pinUntil < CURRENT_TIMESTAMP OR FI.pinUntil IS NULL)
        ) 
        WHERE DP.peopleId = ${userId}
      `,
    })

    return pinnedItems
  },
}

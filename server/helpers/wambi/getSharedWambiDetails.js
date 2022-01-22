const { getFeedItemDetails } = require('../getFeedItemDetails')

const getSharedWambiDetails = async ({ feedItemIds, userId }) => {
  let sharedFeedItemDetails = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT FI.id, FI.itemType, FI.content, FI.createdAt, FI.cpcId, FI.authorId, 
        IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
          CONCAT(LEFT(IFNULL(NULLIF(A.displayName, ''), A.firstName), 1), LEFT(A.lastName, 1))) AS authorImg,
        CONCAT(IFNULL(NULLIF(A.displayName, ''), A.firstName), ' ', A.lastName) AS authorName,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner
      FROM feedItems FI
      LEFT JOIN people A ON (FI.authorId = A.id)
      LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      LEFT JOIN mediaLink MLA ON (A.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
      LEFT JOIN media MA ON (MLA.mediaId = MA.id)
      WHERE FI.id IN (${feedItemIds})
    `,
  })

  await getFeedItemDetails({
    feedItems: sharedFeedItemDetails,
    userId,
  })

  return sharedFeedItemDetails
}

module.exports = {
  getSharedWambiDetails,
}

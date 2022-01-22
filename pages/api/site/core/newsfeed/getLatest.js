const { getCelebrations } = require('@serverHelpers/celebrations/getCelebrations')
const { getFeedItemDetails } = require('@serverHelpers/getFeedItemDetails')
const { getPinItems } = require('@serverHelpers/newsfeed/getPinItems')
const { FEED_ITEM_TYPES, FEED_ITEM_STATUS, GROUP_ACCESS_LEVELS } = require('@utils/types')
const { getUserGroups } = require('@serverHelpers/user/groups')
const { getSharedWambiDetails } = require('@serverHelpers/wambi/getSharedWambiDetails')

const pageSize = 10

export default async (req, res) => {
  try {
    const {
      body: { clientTzOffset, page = 0 },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const { userGroups } = await getUserGroups({ clientAccountId, userId })

    const feedItemsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT
          FI.id, FI.itemType, FI.content, FI.createdAt, FI.cpcId, FI.editedAt, FI.linkedFeedId,
          A.id AS authorId,
          IFNULL(A.jobTitleDisplay, A.jobTitle) AS authorTitle,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(A.displayName, ''), A.firstName), 1), LEFT(A.lastName, 1))) AS authorImg,
          CONCAT(IFNULL(NULLIF(A.displayName, ''), A.firstName), ' ', A.lastName) AS authorName,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner
        FROM (
          -- This sub-select does all the feed realm filtering with INNER JOINs...EK
          SELECT DISTINCT FI.id
          FROM feedItems FI
          INNER JOIN feedGroups FG ON (FI.id = FG.feedId
            AND FI.accountId = ${clientAccountId}
            AND FI.status = ${FEED_ITEM_STATUS.VISIBLE}
            AND (FI.pinUntil < CURRENT_TIMESTAMP
              OR FI.pinUntil IS NULL
            )
          )
          INNER JOIN groupIndex GI ON (FG.groupId = GI.groupId)
          INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userId})
          ORDER BY FI.sortDate DESC
        ) FF
        INNER JOIN feedItems FI ON (FF.id = FI.id)
        LEFT JOIN people A ON (FI.authorId = A.id)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (A.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
        LIMIT ${page * pageSize}, ${pageSize}
      `,
    })

    //Merge pinned and non-pinned items...CY
    let feedItems = (await Promise.all([getPinItems({ clientAccountId, page, userId }), feedItemsQuery])).flat()

    if (feedItems.length) {
      const feedItemIds = feedItems.map(fi => fi.id)

      // Pull the managing group ids for feedGroups, only pull if the user owns any groups...JC
      // See if the user manages at least one group...EK
      const userOwnsGroups = userGroups.length && userGroups.some(g => g.level > GROUP_ACCESS_LEVELS.TEAM_MEMBER)
      if (userOwnsGroups) {
        let managingGroupIds = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT FG.groupId, FG.feedId
            FROM feedGroups FG
            WHERE FG.feedId IN (?)
              AND FG.isManaging = 1
            ORDER BY FG.id DESC
        `,
          params: [feedItemIds],
        })

        // Update feedItems with isManaging flag wherever user manages a group for that feedItem...JC
        feedItems.forEach(feedItem => {
          feedItem.isManaging = managingGroupIds.some(
            group =>
              group.feedId === feedItem.id &&
              userGroups.some(userGroup => userGroup.id === group.groupId && userGroup.level > GROUP_ACCESS_LEVELS.TEAM_MEMBER)
          )
        })
      }

      const celebrationsQuery = getCelebrations({
        pageLimit: 5,
        userId,
        clientAccountId,
        clientTzOffset,
      })

      const feedItemDetailsQuery = getFeedItemDetails({
        feedItems,
        userId,
      })

      const [, feedCelebrations] = await Promise.all([feedItemDetailsQuery, page === 0 ? celebrationsQuery : null])

      // Get share cpc details...CY
      let sharedWambiDetails
      const sharedFeedItems = feedItems.filter(f => f.itemType === FEED_ITEM_TYPES.SHARED_WAMBI).map(f => f.linkedFeedId)
      if (sharedFeedItems.length) sharedWambiDetails = await getSharedWambiDetails({ feedItemIds: sharedFeedItems, userId })

      feedItems.forEach(feedItem => {
        if (feedItem.itemType === FEED_ITEM_TYPES.SHARED_WAMBI)
          feedItem.linkedFeedItem = sharedWambiDetails.find(f => feedItem.linkedFeedId === f.id)
      })

      // Inject celebrations query in 5th spot if it's the first page...JC
      if (feedCelebrations?.length) {
        const celebrationData = {
          itemType: FEED_ITEM_TYPES.CELEBRATION,
          celebrations: feedCelebrations,
        }

        //Find the first occurring nonPinned item and insert celebrations into the 5th index...CY
        const nonPinnedItemIndex = feedItems.findIndex(({ isPinned }) => !isPinned)
        feedItems.splice(nonPinnedItemIndex + 4, 0, celebrationData)
      }

      const postData = {
        itemType: FEED_ITEM_TYPES.POST_WIDGET,
      }

      feedItems.splice(0, 0, postData)
    }

    res.json({ success: true, feedItems })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

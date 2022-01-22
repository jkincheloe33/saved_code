const { getFeedItemDetails } = require('@serverHelpers/getFeedItemDetails')
const { FEED_ITEM_TYPES, FEED_ITEM_STATUS, GROUP_ACCESS_LEVELS } = require('@utils/types')
const { getSharedWambiDetails } = require('@serverHelpers/wambi/getSharedWambiDetails')

export default async (req, res) => {
  try {
    const {
      body: { feedId, updatingNewsfeed = false },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const feedItem = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT DISTINCT
          FI.id, FI.itemType, FI.title, FI.content, FI.createdAt, FI.cpcId, FI.editedAt, FI.linkedFeedId, FI.status,
          A.id AS authorId,
          IFNULL(A.jobTitleDisplay, A.jobTitle) AS authorTitle,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(A.displayName, ''), A.firstName), 1), LEFT(A.lastName, 1))) AS authorImg,
          CONCAT(IFNULL(NULLIF(A.displayName, ''), A.firstName), ' ', A.lastName) AS authorName,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner,
          COUNT(DISTINCT FC.id) AS commentCount
        FROM feedItems FI
        LEFT JOIN people A ON (FI.authorId = A.id)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (A.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
        LEFT JOIN feedComments FC ON (FI.id = FC.feedId)
        LEFT JOIN feedGroups FG ON (FI.id = FG.feedId)
        WHERE FI.id = ?
          AND FI.accountId = ${clientAccountId}
          AND FI.status <> ${FEED_ITEM_STATUS.HIDDEN}
        GROUP BY FI.id
      `,
      params: [feedId],
    })

    if (feedItem) {
      const { feedComments, feedReactions, feedRecipients, feedRecipientsCount, myReactions } = await getFeedItemDetails({
        bindDetails: false,
        feedItems: [feedItem],
        userId,
      })

      // If feed item is an post, check for video.
      // TODO - Refactor to not replace banner with video (Send both to FE)...JC
      if (!feedItem.cpcId) {
        if (feedItem.banner?.includes('/videoStill/') && !updatingNewsfeed) {
          const { announcementVideo } = await wambiDB.querySingle({
            queryText: /*sql*/ `
              SELECT CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS announcementVideo
              FROM feedItems FI
              LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'video')
              LEFT JOIN media M ON (ML.mediaId = M.id)
              WHERE FI.id = ?
            `,
            params: [feedItem.id],
          })
          if (announcementVideo) feedItem.banner = announcementVideo
        }
      }

      // If feed item is a private Wambi, check if user has access...JC
      if (feedItem.cpcId && feedItem.status === FEED_ITEM_STATUS.NON_PUBLIC) {
        const isAuthor = feedItem.authorId === userId
        const isRecipient = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT 1
            FROM feedPeople FP
            WHERE FP.peopleId = ${userId}
              AND FP.feedId = ?
          `,
          params: [feedId],
        })

        const hasWambiGroupAccess = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT 1
            -- Calculate the owned realm(s) groups for the person running the query
            FROM peopleGroups PG
            INNER JOIN groupIndex GI ON (PG.groupId = GI.groupId AND PG.peopleId = ${userId} AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
            INNER JOIN groups G ON (GI.fromGroupId = G.id AND G.accountId = ${clientAccountId})
            -- See if the person who's profile we are viewing is within the realm defined above...EK
            INNER JOIN peopleGroups PG2 ON (PG2.groupId = G.id AND PG2.peopleId IN (
              SELECT FP.peopleId
              FROM feedPeople FP
              WHERE FP.feedId = ?
            ))
          `,
          params: [feedId],
        })

        if (!isAuthor && !isRecipient && !hasWambiGroupAccess) {
          return res.json({ msg: 'User does not have permissions to view feed item', success: false })
        }
      }

      if (feedItem.itemType === FEED_ITEM_TYPES.SHARED_WAMBI)
        feedItem.linkedFeedItem = (await getSharedWambiDetails({ feedItemIds: [feedItem.linkedFeedId], userId }))[0]

      // Check if user owns any of the groups the feedItem is tied to, by realm...KA/JC
      const isFeedItemOwner = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM feedGroups FG
          INNER JOIN groupIndex GI ON (GI.fromGroupId = FG.groupId)
          INNER JOIN peopleGroups PG ON (PG.groupId = GI.groupId
            AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
            AND PG.peopleId = ${userId}
          )
          WHERE FG.feedId = ?
            AND FG.isManaging = 1
        `,
        params: [feedItem.id],
      })

      feedItem.isManaging = isFeedItemOwner ? true : false

      feedItem.id = feedId
      feedItem.reactions = feedReactions
      feedItem.recipients = feedRecipients
      feedItem.recipientCount = feedItem.cpcId ? feedRecipientsCount[0].recipientCount : 0
      feedItem.comments = feedComments.splice(0, 1)

      feedItem.reactions.forEach(reaction => {
        const myReaction = myReactions.find(r => r.feedId === reaction.feedId && reaction.reactionId === r.reactionId)
        if (myReaction != null) {
          reaction.feedReactionId = myReaction.id
        }
      })

      return res.json({ success: true, feedItem })
    }
    return res.json({ msg: 'Unable to retrieve feed item', success: false })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

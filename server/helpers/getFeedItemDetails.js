// Gets feed item details (reactions, recipients, comments) given feed item id(s)...JC
const getFeedItemDetails = async ({ bindDetails = true, feedItems, userId }) => {
  const feedItemIds = feedItems.map(f => f.id)
  const feedReactionsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT
        FR.feedId, R.name, FR.reactionId,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon,
        COUNT(FR.id) AS count
      FROM feedReactions FR
      INNER JOIN reactions R ON (FR.reactionId = R.id)
      LEFT JOIN mediaLink ML ON (R.id = ML.tableKey AND ML.tableName = 'reactions' AND ML.usage = 'icon')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE FR.feedId IN (?)
      GROUP BY R.id, FR.feedId
      ORDER BY FR.feedId, FR.id ASC
    `,
    params: [feedItemIds],
  })

  const myReactionsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT FR.id, FR.reactionId, FR.feedId
      FROM feedReactions FR
      WHERE FR.feedId IN (?)
        AND FR.peopleId = ?
    `,
    params: [feedItemIds, userId],
  })

  // Pull the recipients count and limit by 3 per feed item before pulling recipient details...JC
  const feedRecipientsCount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT feedId,
        -- This next line pulls up to 3 recipients and picks the top three based on who is requested and whether that person has an image or not...EK
        SUBSTRING_INDEX(GROUP_CONCAT(FP.peopleId ORDER BY (FP.peopleId != ${userId}), (ML.id IS null), FP.id SEPARATOR ','), ',', 3) AS peopleIds,
        -- This pulls the count of all recipients by feed item...EK
        COUNT(FP.peopleId) AS recipientCount
      FROM feedPeople FP
      LEFT JOIN mediaLink ML ON (FP.peopleId = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
      WHERE feedId IN (?)
      GROUP BY feedId
    `,
    params: [feedItemIds],
  })

  let feedRecipientsQuery = []
  if (feedRecipientsCount.length) {
    // Pull the recipients based on current feed page...JC
    feedRecipientsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT FP.feedId, FP.peopleId AS recipientId, P.isSelfRegistered,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(P.jobTitleDisplay, P.jobTitle) AS title,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
        FROM people P
        INNER JOIN feedPeople FP ON (FP.peopleId = P.id)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE
          FP.feedId IN (?)
          AND FP.peopleId IN (?)
        -- NOTE: The order clause is repeated here so they are actually displayed in the correct order...EK
        ORDER BY (FP.peopleId != ${userId}), (ML.id IS null), FP.id
    `,
      params: [feedRecipientsCount.map(({ feedId }) => feedId), feedRecipientsCount.flatMap(({ peopleIds }) => peopleIds.split(','))],
    })
  }

  // Get comments based on the feed items (calculate last comment, and the number of comments)
  const commentsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT FC.feedId, FC.comment, FC.createdAt, FC.authorId, IFNULL(FCF.commentCount, 0) AS commentCount,
        CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
        IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
          CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS authorImg
      FROM (
        SELECT FC.feedId, MAX(FC.id) AS lastCommentId, COUNT(FC.id) AS commentCount
        FROM feedComments FC
        WHERE FC.feedId IN (?)
        GROUP BY FC.feedId
      ) FCF
      INNER JOIN feedComments FC ON (FCF.lastCommentId = FC.id)
      INNER JOIN people P ON (FC.authorId = P.id)
      LEFT JOIN mediaLink MLA ON (FC.authorId = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
      LEFT JOIN media MA ON (MLA.mediaId = MA.id)
    `,
    params: [feedItemIds],
  })

  const [feedReactions, myReactions, feedRecipients, feedComments] = await Promise.all([
    feedReactionsQuery,
    myReactionsQuery,
    feedRecipientsQuery,
    commentsQuery,
  ])

  if (bindDetails) {
    feedItems.forEach(feedItem => {
      feedRecipientsCount
        .filter(recipient => recipient.feedId === feedItem.id)
        .forEach(({ recipientCount }) => (feedItem.recipientCount = recipientCount))
      feedItem.recipients = feedRecipients.filter(recipient => recipient.feedId === feedItem.id).splice(0, 3)

      feedItem.comments = feedComments.filter(comment => comment.feedId === feedItem.id)

      // Apply the comment count to the parent feed item from the comment
      feedItem.commentCount = feedItem.comments[0]?.commentCount || 0

      feedItem.reactions = feedReactions.filter(reaction => reaction.feedId === feedItem.id)

      // Apply the feed reaction ID (the actual PK in that table) to the reaction if it is the current user's reaction
      // This will allow the client to display that they reacted to it, and give the ID so it can be removed...EK
      feedItem.reactions.forEach(reaction => {
        const myReaction = myReactions.find(r => r.feedId === reaction.feedId && reaction.reactionId === r.reactionId)
        if (myReaction != null) {
          reaction.feedReactionId = myReaction.id
        }
      })
    })
  }

  return { feedReactions, myReactions, feedRecipients, feedRecipientsCount, feedComments }
}

module.exports = {
  getFeedItemDetails,
}

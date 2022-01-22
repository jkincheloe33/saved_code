const createNotification = require('./create')
const { defaultLanguages, GROUP_ACCESS_LEVELS, NOTIFICATION_TYPE, LANGUAGE_TYPE } = require('../../../utils')
import { getAccountLanguageByType } from '../language'

/*
  Newsfeed Metadata detail: ...CY
    accountId: client id,
    authorId: author id,
    content: content written to db,
    feedId: feedId from Newsfeed (null if private),
    recipients: recipients of Newsfeed,
    sourceKey: people id from whom did the action,
    sourceTable: table from the source key (usually 'people'),
    sourceUsage: Type of action the person did,
    triggerRef: Newsfeed id,
    triggerTable: table sourced from the action (eg comment = feedComments),
    type: type of notification, 
*/

const _generateFeedItemNotification = async ({
  accountId,
  authorId,
  content,
  feedId,
  recipients,
  sourceKey,
  sourceTable,
  sourceUsage,
  triggerRef,
  triggerTable,
  type,
}) => {
  const notificationParams = recipients.map(id => {
    return {
      peopleId: id,
      type,
      status: 0,
      accountId,
      content:
        type === NOTIFICATION_TYPE.CPC_REACTION || type === NOTIFICATION_TYPE.CPC_COMMENTED
          ? id === authorId
            ? content.authorContent
            : content.recipientContent
          : content,
    }
  })

  const linkParams = notificationId =>
    [
      { tableName: triggerTable, tableKey: triggerRef, usage: 'trigger', notificationId },
      { tableName: 'feedItems', tableKey: feedId, usage: 'feedItem', notificationId },
      { tableName: sourceTable, tableKey: sourceKey, usage: sourceUsage, notificationId },
    ].filter(e => e.tableKey != null)

  await createNotification(notificationParams, linkParams)
}

const announcementComment = async (commentId, accountId) => {
  // Note: we are using executeNonQuery here to be sure we are using the write DB on the cluster...EK
  const [commentQuery] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT FC.id, FC.feedId, FC.authorId AS commenterId, FI.authorId,
        CONCAT(IFNULL(NULLIF(CP.displayName, ''), CP.firstName), ' ', CP.lastName) AS commenter
      FROM feedComments FC
      LEFT JOIN people CP ON (CP.id = FC.authorId)
      LEFT JOIN feedItems FI ON (FI.id = FC.feedId)
      WHERE FC.id = ?
    `,
    params: [commentId],
  })

  const { authorId, commenter, commenterId, feedId, id } = commentQuery

  if (authorId === commenterId) return

  const metaData = {
    accountId,
    authorId,
    content: `<b>${commenter}</b> commented on an Announcement you sent`,
    feedId: feedId,
    recipients: [authorId],
    sourceKey: commenterId,
    sourceTable: 'people',
    sourceUsage: 'commenter',
    triggerRef: id,
    triggerTable: 'feedComments',
    type: NOTIFICATION_TYPE.ANNOUNCEMENT_COMMENTED,
  }
  await _generateFeedItemNotification(metaData)
}

const announcementReaction = async (reactionId, accountId) => {
  // Note: we are using executeNonQuery here to be sure we are using the write DB on the cluster...EK
  const [reactionQuery] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT FI.authorId,
        CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName) AS reactor,
        FR.peopleId as reactorId, FR.id as reactionId, FR.feedId,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS reaction
      FROM feedReactions FR
      LEFT JOIN people RP ON (FR.peopleId = RP.id)
      LEFT JOIN feedItems FI ON (FI.id = FR.feedId)
      LEFT JOIN mediaLink ML ON (ML.tableName = 'reactions' AND ML.tableKey = FR.reactionId AND ML.usage = 'icon')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE FR.id = ?
    `,
    params: [reactionId],
  })

  const { authorId, feedId, reaction, reactor, reactorId } = reactionQuery

  if (authorId === reactorId) return

  const metaData = {
    accountId,
    authorId,
    content: `<b>${reactor}</b> reacted <img>${reaction}</img> to a post you created`,
    feedId: feedId,
    recipients: [authorId],
    sourceKey: reactorId,
    sourceTable: 'people',
    sourceUsage: 'reactor',
    triggerRef: reactionId,
    triggerTable: 'feedReactions',
    type: NOTIFICATION_TYPE.ANNOUNCEMENT_REACTION,
  }
  await _generateFeedItemNotification(metaData)
}

const cpcReaction = async (reactionId, accountId) => {
  // Note: we are using executeNonQuery here to be sure we are using the write DB on the cluster...EK
  const [reactionQuery] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT FI.authorId,
        CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName) AS reactor,
        CONCAT(IFNULL(NULLIF(AP.displayName, ''), AP.firstName), ' ', AP.lastName) AS author, 
        FR.peopleId as reactorId, FR.id as reactionId, FR.feedId,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS reaction
      FROM feedReactions FR
      LEFT JOIN people RP ON (FR.peopleId = RP.id)
      LEFT JOIN feedItems FI ON (FI.id = FR.feedId)
      LEFT JOIN people AP ON (AP.id = FI.authorId)
      LEFT JOIN mediaLink ML ON (ML.tableName = 'reactions' AND ML.tableKey = FR.reactionId AND ML.usage = 'icon')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE FR.id = ?
    `,
    params: [reactionId],
  })

  const { author, authorId, feedId, reaction, reactor, reactorId } = reactionQuery

  let recipients = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT peopleId AS id
      FROM feedPeople
      WHERE feedId = ? 
        AND peopleId <> ?
    `,
    params: [reactionQuery.feedId, reactorId],
  })

  recipients = authorId && authorId !== reactorId ? [authorId, ...recipients.map(({ id }) => id)] : recipients.map(({ id }) => id)

  // NOTE: WP-4131 - Due to 35K people being notified and causing DB write / lock issues.  Limit to 20 or less for now...EK
  if (recipients.length > 20) recipients.length = 20
  const patientLanguage =
    (await getAccountLanguageByType({ clientAccountId: accountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]
  if (recipients.length) {
    const metaData = {
      accountId,
      authorId,
      content: {
        authorContent: `<b>${reactor}</b> reacted <img>${reaction}</img> to a Wambi you sent`,
        recipientContent: `<b>${reactor}</b> reacted <img>${reaction}</img> to your Wambi from <b>${
          author ?? `a ${patientLanguage.toLowerCase()}`
        }</b>`,
      },
      feedId: feedId,
      recipients,
      sourceKey: reactorId,
      sourceTable: 'people',
      sourceUsage: 'reactor',
      triggerRef: reactionId,
      triggerTable: 'feedReactions',
      type: NOTIFICATION_TYPE.CPC_REACTION,
    }
    await _generateFeedItemNotification(metaData)
  }
}

const cpcComment = async (commentId, accountId) => {
  // Note: we are using executeNonQuery here to be sure we are using the write DB on the cluster...EK
  const [commentQuery] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT FC.id, FC.feedId, FC.authorId as commenterId, FI.authorId,
        CONCAT(IFNULL(NULLIF(CP.displayName, ''), CP.firstName), ' ', CP.lastName) AS commenter,
        CONCAT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), ' ', SP.lastName) AS author
      FROM feedComments FC
      LEFT JOIN people CP ON (CP.id = FC.authorId)
      LEFT JOIN feedItems FI ON (FI.id = FC.feedId)
      LEFT JOIN people SP ON (SP.id = FI.authorId)
      WHERE FC.id = ?
    `,
    params: [commentId],
  })

  const { author, authorId, commenter, commenterId, feedId, id } = commentQuery

  let recipients = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT peopleId AS id
      FROM feedPeople 
      WHERE feedId = ? AND peopleId <> ? 
    `,
    params: [commentQuery.feedId, commenterId],
  })

  recipients = authorId && authorId !== commenterId ? [authorId, ...recipients.map(({ id }) => id)] : recipients.map(({ id }) => id)
  const patientLanguage =
    (await getAccountLanguageByType({ clientAccountId: accountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]

  // NOTE: WP-4131 - Due to 35K people being notified and causing DB write / lock issues.  Limit to 20 or less for now...EK
  if (recipients.length > 20) recipients.length = 20

  if (recipients.length) {
    const metaData = {
      accountId,
      authorId,
      content: {
        authorContent: `<b>${commenter}</b> commented on a Wambi you sent`,
        recipientContent: `<b>${commenter}</b> commented on your Wambi from <b>${author ?? `a ${patientLanguage.toLowerCase()}`}</b>`,
      },
      feedId: feedId,
      recipients,
      sourceKey: commenterId,
      sourceTable: 'people',
      sourceUsage: 'commenter',
      triggerRef: id,
      triggerTable: 'feedComments',
      type: NOTIFICATION_TYPE.CPC_COMMENTED,
    }
    await _generateFeedItemNotification(metaData)
  }
}

const postAnnouncement = async ({ accountId, feedId, groups = [], traits = [], userId }) => {
  if (groups.length > 0 || traits.length > 0) {
    try {
      let recipients = []

      if (traits.length > 0) {
        // Note: we are using executeNonQuery here to be sure we are using the write DB on the cluster...EK
        recipients = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            SELECT DISTINCT PT.peopleId AS id 
            FROM peopleTraits PT
            INNER JOIN peopleGroups PG ON (PG.peopleId = PT.peopleId AND PG.groupId IN (?))
            LEFT JOIN groupIndex GI ON (PG.groupId = GI.fromGroupId)
            -- Get group owner and delegate owner
            LEFT JOIN peopleGroups DPG ON (DPG.peopleId = PT.peopleId AND PG.groupId IN (?))
            WHERE 
              (PT.traitId IN (?) OR DPG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}) AND 
              PT.peopleId <> ?
          `,
          params: [groups.map(({ id }) => id), groups.map(({ id }) => id), traits.map(({ id }) => id), userId],
        })
      } else {
        recipients = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT peopleId AS id 
            FROM peopleGroups PG
            INNER JOIN groupIndex GI ON (PG.groupId = GI.fromGroupId AND GI.groupId IN (?)) 
            WHERE PG.peopleId <> ?
        `,
          params: [groups.map(({ id }) => id), userId],
        })
      }

      const author = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) as name
          FROM people P
          WHERE P.id = ?
      `,
        params: [userId],
      })

      if (author && recipients.length > 0) {
        const metaData = {
          accountId,
          content: `<b>${author.name}</b> created a post`,
          recipients: recipients.map(({ id }) => id),
          sourceKey: userId,
          sourceTable: 'people',
          sourceUsage: 'author',
          triggerRef: feedId,
          triggerTable: 'feedItems',
          type: NOTIFICATION_TYPE.POST_ANNOUNCEMENT,
        }

        await _generateFeedItemNotification(metaData)
      }
    } catch (error) {
      console.log('Error creating post notification', error)
    }
  }
}

const sendWambi = async ({ feedId, recipients, userId = null }, accountId) => {
  const patientLanguage =
    (await getAccountLanguageByType({ clientAccountId: accountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]
  let author = `A ${patientLanguage.toLowerCase()}`
  if (userId) {
    const people = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
        FROM people P
        WHERE P.id = ?
      `,
      params: [userId],
    })

    author = people.name
  }

  const metaData = {
    accountId,
    content: recipients.length > 1 ? `<b>${author}</b> sent your group a very special Wambi!` : `<b>${author}</b> sent you a Wambi`,
    feedId: feedId,
    recipients: recipients,
    sourceKey: userId,
    sourceTable: 'people',
    sourceUsage: 'author',
    triggerRef: feedId,
    triggerTable: 'feedItems',
    type: userId ? NOTIFICATION_TYPE.PEER_CPC_SENT : NOTIFICATION_TYPE.PATIENT_CPC_SENT,
  }
  await _generateFeedItemNotification(metaData)
}

const sendPrivateWambi = async ({ feedId, recipients, userId }, accountId) => {
  const author = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
      FROM people P
      WHERE P.id = ?
    `,
    params: [userId],
  })

  const metaData = {
    accountId,
    content: `<b>${author.name}</b> sent you a Wambi`,
    recipients: recipients,
    sourceKey: userId,
    sourceTable: 'people',
    sourceUsage: 'author',
    triggerRef: feedId,
    triggerTable: 'feedItems',
    type: NOTIFICATION_TYPE.POST_PRIVATE_CPC,
  }

  await _generateFeedItemNotification(metaData)
}

module.exports = {
  announcementComment,
  announcementReaction,
  cpcComment,
  cpcReaction,
  postAnnouncement,
  sendWambi,
  sendPrivateWambi,
}

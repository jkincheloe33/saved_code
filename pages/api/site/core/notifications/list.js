import { NOTIFICATION_STATUS, NOTIFICATION_TYPE, PRIORITY_NOTIFICATIONS } from '@utils'

const imageRef = {
  [NOTIFICATION_TYPE.ANNOUNCEMENT_COMMENTED]: 'commenter',
  [NOTIFICATION_TYPE.ANNOUNCEMENT_REACTION]: 'reactor',
  [NOTIFICATION_TYPE.CHALLENGE_ISSUED]: 'trigger',
  [NOTIFICATION_TYPE.CPC_COMMENTED]: 'commenter',
  [NOTIFICATION_TYPE.CPC_REACTION]: 'reactor',
  [NOTIFICATION_TYPE.MANAGER_HOT_STREAK]: 'trigger',
  [NOTIFICATION_TYPE.PEER_CPC_SENT]: 'author',
  [NOTIFICATION_TYPE.POST_PRIVATE_CPC]: 'author',
  [NOTIFICATION_TYPE.POST_ANNOUNCEMENT]: 'author',
}

// Create metadata to get images...CY
const _compileImageBundle = links => ({ id, type }) => {
  const notificationType = Object.values(NOTIFICATION_TYPE).find(e => e === type)

  // Allow to render new notifications or notification without images...CY
  if (notificationType == null || imageRef[notificationType] == null)
    return { tableName: null, tableKey: null, usage: null, notificationId: null }

  const mediaLink = notificationType === NOTIFICATION_TYPE.CHALLENGE_ISSUED ? 'challenge' : 'thumbnail'
  const { tableKey, tableName } = links.find(({ notificationId, usage }) => notificationId === id && imageRef[notificationType] === usage)
  return { tableName, tableKey, usage: mediaLink, notificationId: id }
}

export default async (req, res) => {
  const {
    body: { page },
    session: { userId },
    clientAccount: { id: clientAccountId },
  } = req

  let images = []
  let notificationData = []
  const notificationQueries = []
  const pageLimit = 20

  try {
    const hasUnreadNotifications = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM notifications
        WHERE peopleId = ${userId}
          AND status = ${NOTIFICATION_STATUS.UNREAD}
          AND accountId = ${clientAccountId}
          AND type NOT IN (${PRIORITY_NOTIFICATIONS})
      `,
    })

    // This ensure that new notification won't be skipped over by pagination...CY
    const currentPage = hasUnreadNotifications ? 0 : page

    // Get unread priority notifications on the first page since there are limited numbers of them created...CY
    if (page === 0) {
      const unreadPriorityNotificationQuery = wambiDB.query({
        queryText: /*sql*/ `
          SELECT id, content, status, createdAt, type
          FROM notifications
          WHERE peopleId = ${userId}
            AND status = ${NOTIFICATION_STATUS.UNREAD}
            AND type IN (${PRIORITY_NOTIFICATIONS})
            AND accountId = ${clientAccountId}
          ORDER BY
            createdAt DESC
        `,
      })

      notificationQueries.push(unreadPriorityNotificationQuery)
    }

    const notificationQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT id, content, status, createdAt, type
        FROM notifications
        WHERE peopleId = ${userId}
          AND (DATEDIFF(CURRENT_TIMESTAMP, createdAt) <= 14 OR status = ${NOTIFICATION_STATUS.UNREAD})
          -- Remove unread priority notifications...CY
          AND (type NOT IN (${PRIORITY_NOTIFICATIONS}) OR status = ${NOTIFICATION_STATUS.READ})
          AND accountId = ${clientAccountId}
        ORDER BY
          status ASC,
          createdAt DESC
        LIMIT ${currentPage * pageLimit}, ${pageLimit}
      `,
    })

    notificationQueries.push(notificationQuery)

    const notifications = (await Promise.all(notificationQueries)).flat()

    if (notifications.length > 0) {
      const links = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT *
          FROM notificationLinks
          WHERE notificationId IN (?)
        `,
        params: [notifications.map(({ id }) => id)],
      })

      const nonPeopleImageBundle = notifications.map(_compileImageBundle(links)).filter(({ tableName }) => tableName !== 'people')
      const peopleImageBundle = notifications.map(_compileImageBundle(links)).filter(({ tableName }) => tableName === 'people')

      // Get non people image...CY
      if (nonPeopleImageBundle.length > 0) {
        let imageData = []
        const notificationsWithImage = nonPeopleImageBundle.filter(({ tableName, tableKey, usage }) => tableName && tableKey && usage)

        const notificationsWithoutImage = nonPeopleImageBundle
          .filter(({ tableName, tableKey, usage }) => !(tableName && tableKey && usage))
          .map(({ notificationId }) => ({ image: null, notificationId }))

        // Only query notifications with required data...CY
        if (notificationsWithImage.length) {
          imageData = await wambiDB.query({
            queryText: /*sql*/ `
              SELECT ML.tableName, ML.tableKey, ML.usage,
                CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
              FROM mediaLink ML
              LEFT JOIN media M ON (ML.mediaId = M.id)
              WHERE (ML.tableName, ML.tableKey, ML.usage) IN (?)
            `,
            params: [notificationsWithImage.map(e => [e.tableName, e.tableKey, e.usage])],
          })
        }

        const nonPeopleImages = notificationsWithImage.map(({ notificationId, tableKey, tableName, usage }) => ({
          notificationId,
          image: imageData.find(e => e.tableKey === tableKey && e.tableName === tableName && e.usage === usage)?.image,
        }))

        images = [...images, ...nonPeopleImages, ...notificationsWithoutImage]
      }

      // Get people image or initials...CY
      if (peopleImageBundle.length > 0) {
        const imageData = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT P.id tableKey,
              IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
            FROM people P
            LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail')
            LEFT JOIN media M ON (ML.mediaId = M.id)
            WHERE P.id IN (?)
          `,
          params: [peopleImageBundle.map(e => [e.tableKey])],
        })

        const peopleImages = peopleImageBundle.map(({ notificationId, tableKey }) => ({
          notificationId,
          image: imageData.find(e => e.tableKey === tableKey)?.image,
        }))

        images = [...images, ...peopleImages]
      }

      // Assign links and images to notifications...CY
      notificationData = notifications.map(notification => {
        const notificationLinks = links.filter(({ notificationId }) => notification.id === notificationId)
        const media = images.find(({ notificationId }) => notificationId === notification.id)
        return { ...notification, notificationLinks, image: media ? media.image : null }
      })

      res.json({ success: true, notificationData })

      // Update unread notifications to read...CY
      const unreadNotifications = notificationData
        .filter(n => n.status === NOTIFICATION_STATUS.UNREAD && !PRIORITY_NOTIFICATIONS.some(t => t === n.type))
        .map(({ id }) => id)

      // Update unread notifications then prune notifications createdAt > 14 days...CY
      if (unreadNotifications.length > 0) {
        const [updateQuery] = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE notifications
            SET readAt = CURRENT_TIMESTAMP,
              status = ${NOTIFICATION_STATUS.READ}
            WHERE id IN (?);
            DELETE FROM notifications
            WHERE peopleId = ${userId}
              AND (DATEDIFF(CURRENT_TIMESTAMP, createdAt)) > 14
              AND status = ${NOTIFICATION_STATUS.READ}
          `,
          params: [unreadNotifications],
        })

        if (updateQuery.affectedRows === 0) console.error('Failed to update unread notifications')
      }
    } else res.json({ notificationData: [], success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

import { NOTIFICATION_STATUS } from '@utils'

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  try {
    const newNotification = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM notifications
        WHERE peopleId = ${userSessionId}
          AND status = ${NOTIFICATION_STATUS.UNREAD}
          AND accountId = ${clientAccountId}
      `,
    })

    res.json({ success: true, newNotification: newNotification != null })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

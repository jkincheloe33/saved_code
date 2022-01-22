import { NOTIFICATION_STATUS } from '@utils/types'

export default async (req, res) => {
  const {
    body: { id },
    session: { userId },
  } = req

  try {
    const readNotification = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE notifications
        SET readAt = CURRENT_TIMESTAMP,
          status = ${NOTIFICATION_STATUS.READ}
        WHERE id = ?
          AND peopleId = ${userId}
      `,
      params: [id],
    })

    res.json({ success: readNotification.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

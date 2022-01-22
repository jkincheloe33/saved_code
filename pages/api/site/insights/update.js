import { INSIGHT_STATUS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      body: { insightId, newStatus },
      session: { userId },
      clientAccount: { id: clientAccountId },
    } = req

    if (newStatus === INSIGHT_STATUS.ADDRESSED || newStatus === INSIGHT_STATUS.DISMISSED) {
      const updateDateColumn = newStatus === INSIGHT_STATUS.ADDRESSED ? 'addressedAt' : 'dismissedAt'

      const updateInsight = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE insights 
          SET ${updateDateColumn} = CURRENT_TIMESTAMP,
            status = ${newStatus}
          WHERE id = ?
            AND accountId = ${clientAccountId}
            AND peopleId = ${userId}
            AND status = ${INSIGHT_STATUS.ACTIVE}
        `,
        params: [insightId],
      })

      res.json({ success: updateInsight.affectedRows === 1 })
    } else res.json({ success: false, msg: 'Invalid update to insight' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to update insight. Please try again later' })
  }
}

const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')
const { getFeedbackDetails } = require('@serverHelpers/survey/getFeedbackDetails')
import { FOLLOW_UP_STATUS as status } from '@utils'

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const {
        body: { followUpStatus, surveyId },
        clientAccount: { id: clientAccountId },
        session: { userId },
      } = req

      const newStatus = followUpStatus === status.REQUESTED ? status.COMPLETED : status.REQUESTED

      const hasAccess = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM surveys S
          INNER JOIN (
            ${selectLeaderPeople({ clientAccountId, userId })}
          ) PM ON (S.peopleId = PM.id)
          WHERE S.id = ? 
            AND S.accountId = ${clientAccountId}
        `,
        params: [surveyId],
      })

      if (!hasAccess) return res.json({ success: false, msg: 'User does not have access' })

      const updateStatusRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE surveys S
          SET S.followUpStatus = ?, S.followUpBy = ${newStatus === status.REQUESTED ? 'NULL' : userId}, 
            S.followUpAt = ${newStatus === status.REQUESTED ? 'NULL' : 'CURRENT_TIMESTAMP'}
          WHERE S.id = ? 
        `,
        params: [newStatus, surveyId],
      })

      if (updateStatusRes.affectedRows === 1) {
        const { success, surveyDetails } = await getFeedbackDetails({ clientAccountId, req, updatedFeedback: true, userId, surveyId })

        if (success) return res.json({ success: true, surveyDetails })
        else return res.json({ success: false, msg: 'Error getting updated details' })
      }
      res.json({ success: false, msg: 'Error updating follow up status' })
    } catch (error) {
      logServerError({ error, req })
      res.json({ success: false, msg: 'Error occurred; check server logs.' })
    }
  }
}

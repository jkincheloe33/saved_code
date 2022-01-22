const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')
const { getFeedbackDetails } = require('@serverHelpers/survey/getFeedbackDetails')

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const {
        body: { note, surveyId },
        clientAccount: { id: clientAccountId },
        session: { userId },
      } = req

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

      const noteAddRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO surveyNotes
          SET ?
        `,
        params: [{ authorId: userId, note, surveyId }],
      })

      if (noteAddRes.affectedRows === 1) {
        const { success, surveyDetails } = await getFeedbackDetails({ clientAccountId, req, updatedFeedback: true, userId, surveyId })

        if (success) return res.json({ success: true, surveyDetails })
        else return res.json({ success: false, msg: 'Error getting updated details' })
      }
      res.json({ success: false, msg: 'Error saving follow up note' })
    } catch (error) {
      logServerError({ error, req })
      res.json({ success: false, msg: 'Error occurred; check server logs.' })
    }
  }
}

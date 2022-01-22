const { getFeedbackDetails } = require('@serverHelpers/survey/getFeedbackDetails')

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { surveyId },
      session: { userId },
    } = req

    const { success, surveyDetails } = await getFeedbackDetails({ clientAccountId, req, userId, surveyId })

    if (success) res.json({ success: true, surveyDetails })
    else res.json({ success: false, msg: 'Error getting follow up details' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

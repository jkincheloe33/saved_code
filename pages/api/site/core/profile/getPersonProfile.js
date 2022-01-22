const { getChallenges } = require('@serverHelpers/challenges/getChallenges')
const { getWambis } = require('@serverHelpers/wambi')
const getPersonDetails = require('@serverHelpers/user/getDetails')

export default async (req, res) => {
  try {
    const {
      body: { personId },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    const person = await getPersonDetails({ clientAccountId, userId: personId })

    const { challenges } = await getChallenges({
      clientAccountId,
      isMe: false,
      limit: 4,
      req,
      userId: personId,
    })

    const { cpc } = await getWambis({
      clientAccountId,
      isMe: false,
      limit: 2,
      userId: personId,
      type: 'both',
      userSessionId,
    })

    res.json({ success: true, challenges, cpc, person })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
